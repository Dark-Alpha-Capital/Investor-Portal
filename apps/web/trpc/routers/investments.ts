import { TRPCError } from "@trpc/server";
import { investment, deal } from "@repo/db/schema";
import {
  getNextAdminAdvanceStatus,
  INVESTMENT_EXIT_STATUSES,
  isActiveCommitmentStatus,
  isPortfolioModeStatus,
  PORTFOLIO_EXIT_STATUSES,
} from "@repo/db/investment-closing";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getDealPermissions } from "@/lib/auth/permissions";
import { isOpenForCommitments } from "@repo/db/deal-marketplace";
import {
  createCommitment,
  recordFunding,
  resolveEntitySnapshot,
  transitionInvestmentStatus,
} from "@/lib/closing/services/investment-closing-service";

const portfolioExitStatusSchema = z.enum(PORTFOLIO_EXIT_STATUSES);

function toTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  const message =
    error instanceof Error ? error.message : "Investment closing error";
  if (message === "Forbidden") {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
  if (message.includes("not found") || message.includes("Not found")) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
  if (
    message.includes("Illegal") ||
    message.includes("Cannot") ||
    message.includes("required") ||
    message.includes("Acknowledgement")
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: error,
  });
}

async function findActiveCommitment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  dealId: string,
  userId: string,
) {
  const rows = await db
    .select({ id: investment.id, status: investment.status })
    .from(investment)
    .where(and(eq(investment.dealId, dealId), eq(investment.userId, userId)))
    .orderBy(desc(investment.createdAt));

  return (
    (rows as Array<{ id: string; status: string }>).find((row) =>
      isActiveCommitmentStatus(row.status),
    ) ?? null
  );
}

export const investmentsRouter = createTRPCRouter({
  /**
   * Investor commits capital to a deal (starts subscription closing).
   * Archived cancelled/expired/rejected attempts do not block a new commitment.
   */
  commit: protectedProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        committedAmount: z.number().positive(),
        entityName: z.string().min(1).optional(),
        entityType: z.enum(["individual", "entity"]).optional(),
        acknowledgementAccepted: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "admin";

      // Admins manage closing; investors originate commitments.
      if (isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Admins cannot create commitments. Investors commit from the deal page.",
        });
      }

      const permissions = await getDealPermissions(userId, input.dealId);
      if (!permissions?.canInvest) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to commit capital to this deal",
        });
      }

      const [dealRow] = await ctx.db
        .select({
          id: deal.id,
          status: deal.status,
          deletedAt: deal.deletedAt,
          minInvestment: deal.minInvestment,
        })
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRow || dealRow.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!isOpenForCommitments(dealRow)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This deal is not open for new commitments",
        });
      }

      if (
        dealRow.minInvestment != null &&
        input.committedAmount < dealRow.minInvestment
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Commitment must be at least $${dealRow.minInvestment.toLocaleString()}`,
        });
      }

      const existing = await findActiveCommitment(
        ctx.db,
        input.dealId,
        userId,
      );
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active capital commitment for this deal",
        });
      }

      try {
        const entity = await resolveEntitySnapshot(ctx.db, userId, {
          entityName: input.entityName,
          entityType: input.entityType,
        });

        const result = await createCommitment(
          ctx.db,
          {
            dealId: input.dealId,
            userId,
            committedAmount: input.committedAmount,
            entityName: entity.entityName,
            entityType: entity.entityType,
            acknowledgementAccepted: input.acknowledgementAccepted,
          },
          { userId, role: "investor" },
        );

        const [fresh] = await ctx.db
          .select()
          .from(investment)
          .where(eq(investment.id, result.investment.id))
          .limit(1);

        return {
          success: true,
          investment: fresh ?? result.investment,
          packageId: result.packageId,
          message: "Capital commitment recorded",
        };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  /**
   * @deprecated Admin-created commitments removed. Investors commit from the deal page.
   */
  create: adminProcedure
    .input(z.object({ dealId: z.string().min(1) }).passthrough())
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Admins cannot create commitments. Investors commit from the deal page; use Closing to manage the workflow.",
      });
    }),

  /**
   * Admin advances along the happy-path closing map where defined.
   * Prefer Closing drawer actions (generate / send / fund) over this.
   */
  advanceStatus: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(investment)
        .where(eq(investment.id, input.investmentId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      const nextStatus = getNextAdminAdvanceStatus(row.status);
      if (!nextStatus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot advance status from "${row.status}". Use the Closing drawer.`,
        });
      }

      try {
        const updated = await transitionInvestmentStatus(ctx.db, {
          investmentId: input.investmentId,
          toStatus: nextStatus,
          actor: "admin",
          actorUserId: ctx.session.user.id,
          reason: `Admin advanced to ${nextStatus}`,
        });

        return {
          success: true,
          investment: updated,
          message: `Status advanced to ${nextStatus}`,
        };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  /**
   * Admin records that capital has been wired (Closing → Mark Funds Received).
   */
  recordFunding: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        fundedAmount: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await recordFunding(
          ctx.db,
          input.investmentId,
          input.fundedAmount,
          ctx.session.user.id,
        );

        return {
          success: true,
          investment: updated,
          message: "Funding recorded",
        };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  /**
   * Portfolio administration — only after funding.
   * Closing status is never set here; exit statuses only.
   */
  update: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        currentValue: z.number().min(0).optional(),
        distributions: z.number().min(0).optional(),
        ownershipPercentage: z.number().min(0).max(100).optional().nullable(),
        status: portfolioExitStatusSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(investment)
        .where(eq(investment.id, input.investmentId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      if (!isPortfolioModeStatus(row.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Portfolio fields can only be updated after the investment is funded. Use Closing for the subscription workflow.",
        });
      }

      const updates: {
        currentValue?: number;
        distributions?: number;
        ownershipPercentage?: number | null;
        status?: (typeof INVESTMENT_EXIT_STATUSES)[number];
      } = {};

      if (input.currentValue !== undefined) {
        updates.currentValue = input.currentValue;
      }
      if (input.distributions !== undefined) {
        updates.distributions = input.distributions;
      }
      if (input.ownershipPercentage !== undefined) {
        updates.ownershipPercentage = input.ownershipPercentage;
      }
      if (input.status !== undefined) {
        updates.status = input.status;
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }

      const [updated] = await ctx.db
        .update(investment)
        .set(updates)
        .where(eq(investment.id, input.investmentId))
        .returning();

      return {
        success: true,
        investment: updated,
        message: "Portfolio updated",
      };
    }),
});

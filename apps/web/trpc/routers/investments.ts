import { TRPCError } from "@trpc/server";
import { investment, deal } from "@repo/db/schema";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getDealPermissions } from "@/lib/auth/permissions";
import { isOpenForCommitments } from "@repo/db/deal-marketplace";

const commitmentLifecycleStatuses = [
  "committed",
  "pending",
  "confirmed",
  "funded",
] as const;

const exitStatuses = ["transferred", "liquidated", "written_off"] as const;

const investmentStatusSchema = z.enum([
  ...commitmentLifecycleStatuses,
  ...exitStatuses,
]);

const ADVANCE_MAP = {
  committed: "pending",
  pending: "confirmed",
} as const;

type AdvanceFrom = keyof typeof ADVANCE_MAP;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("unique") ||
      error.message.includes("UNIQUE") ||
      error.message.includes("duplicate") ||
      error.message.includes("23505"))
  );
}

export const investmentsRouter = createTRPCRouter({
  /**
   * Investor commits capital to a deal.
   * Creates an investment at status `committed`.
   */
  commit: protectedProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        committedAmount: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "admin";

      if (!isAdmin) {
        const permissions = await getDealPermissions(userId, input.dealId);
        if (!permissions?.canInvest) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to commit capital to this deal",
          });
        }
      }

      const [dealRow] = await ctx.db
        .select({
          id: deal.id,
          status: deal.status,
          minInvestment: deal.minInvestment,
        })
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!isAdmin && !isOpenForCommitments(dealRow)) {
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

      const [existing] = await ctx.db
        .select({ id: investment.id })
        .from(investment)
        .where(
          and(
            eq(investment.dealId, input.dealId),
            eq(investment.userId, userId),
          ),
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a capital commitment for this deal",
        });
      }

      const id = randomUUID();
      const now = new Date();

      try {
        const [created] = await ctx.db
          .insert(investment)
          .values({
            id,
            dealId: input.dealId,
            userId,
            committedAmount: input.committedAmount,
            committedDate: now,
            fundedAmount: 0,
            status: "committed",
          })
          .returning();

        return {
          success: true,
          investment: created,
          message: "Capital commitment recorded",
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have a capital commitment for this deal",
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create commitment",
          cause: error,
        });
      }
    }),

  /**
   * Admin creates a capital commitment for any investor.
   */
  create: adminProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        userId: z.string().min(1),
        committedAmount: z.number().positive(),
        committedDate: z.string().optional(),
        ownershipPercentage: z.number().min(0).max(100).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [dealRow] = await ctx.db
        .select({ id: deal.id })
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const [existing] = await ctx.db
        .select({ id: investment.id })
        .from(investment)
        .where(
          and(
            eq(investment.dealId, input.dealId),
            eq(investment.userId, input.userId),
          ),
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This investor already has a commitment for this deal",
        });
      }

      const id = randomUUID();
      const committedDate = input.committedDate
        ? new Date(input.committedDate)
        : new Date();

      try {
        const [created] = await ctx.db
          .insert(investment)
          .values({
            id,
            dealId: input.dealId,
            userId: input.userId,
            committedAmount: input.committedAmount,
            committedDate,
            fundedAmount: 0,
            status: "committed",
            ownershipPercentage: input.ownershipPercentage ?? null,
          })
          .returning();

        return {
          success: true,
          investment: created,
          message: "Capital commitment created",
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This investor already has a commitment for this deal",
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create commitment",
          cause: error,
        });
      }
    }),

  /**
   * Admin advances commitment: committed → pending → confirmed.
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

      if (!(row.status in ADVANCE_MAP)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot advance status from "${row.status}". Use record funding to mark as funded, or update for exit statuses.`,
        });
      }

      const nextStatus = ADVANCE_MAP[row.status as AdvanceFrom];

      const [updated] = await ctx.db
        .update(investment)
        .set({ status: nextStatus })
        .where(eq(investment.id, input.investmentId))
        .returning();

      return {
        success: true,
        investment: updated,
        message: `Status advanced to ${nextStatus}`,
      };
    }),

  /**
   * Admin records that capital has been wired.
   * Sets fundedAmount and status to `funded`.
   */
  recordFunding: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        fundedAmount: z.number().positive(),
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

      if (
        row.status === "transferred" ||
        row.status === "liquidated" ||
        row.status === "written_off"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot record funding for a ${row.status} investment`,
        });
      }

      const [updated] = await ctx.db
        .update(investment)
        .set({
          fundedAmount: input.fundedAmount,
          status: "funded",
        })
        .where(eq(investment.id, input.investmentId))
        .returning();

      return {
        success: true,
        investment: updated,
        message: "Funding recorded",
      };
    }),

  /**
   * Admin updates ownership, NAV, distributions, or exit status.
   */
  update: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        currentValue: z.number().min(0).optional(),
        distributions: z.number().min(0).optional(),
        ownershipPercentage: z.number().min(0).max(100).optional().nullable(),
        status: investmentStatusSchema.optional(),
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

      const updates: {
        currentValue?: number;
        distributions?: number;
        ownershipPercentage?: number | null;
        status?: z.infer<typeof investmentStatusSchema>;
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
        message: "Investment updated",
      };
    }),
});

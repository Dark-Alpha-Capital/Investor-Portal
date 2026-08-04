import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import {
  deal,
  dealInterest,
  investment,
  sideEffectOutbox,
  user,
  vehiclePermission,
  investorClearance,
  auditLog,
  chat,
  capitalNotice,
} from "@repo/db/schema";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../init";
import slugify from "slugify";
import { createDealSchema } from "@/lib/schemas/create-deal-schema";
import { dispatchPendingOutbox } from "@/lib/queues/outbox";
import {
  eq,
  or,
  isNull,
  and,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { createDealFileStore } from "@/lib/deals/deal-file-store";
import { logDataRoomAccessRequest } from "@/lib/audit";
import { getMarketplaceDeals as getMarketplaceDealsQuery } from "@repo/db/queries";

const dealFileStore = createDealFileStore();

const parseNumericField = (value: string | undefined | null): number | null => {
  if (!value) return null;
  // Accept typed money strings like "1,000,000"
  const parsed = parseFloat(value.replace(/,/g, ""));
  return isNaN(parsed) ? null : parsed;
};

const makeOutboxPayload = (
  jobName: string,
  jobId: string,
  data: Record<string, unknown>
) => ({
  queue: "deal" as const,
  jobName,
  jobId,
  data,
});

export const dealsRouter = createTRPCRouter({
  create: adminProcedure
    .input(createDealSchema)
    .mutation(async ({ input, ctx }) => {
      // Generate slug from name
      const slug = slugify(input.name, { lower: true, strict: true });
      const dealId = randomUUID();

      // Prepare deal data
      const dealData = {
        id: dealId,
        name: input.name,
        slug: slug,
        description: input.description || null,
        teaserSummary: input.teaserSummary || null,
        sector: input.sector || null,
        geography: input.geography || null,
        dealType: input.dealType || null,
        targetRaise: parseNumericField(input.targetRaise),
        minInvestment: parseNumericField(input.minInvestment),
        targetIrr: parseNumericField(input.targetIrr),
        targetMoic: parseNumericField(input.targetMoic),
        targetCompany: input.targetCompany || null,
        revenue: parseNumericField(input.revenue),
        ebitda: parseNumericField(input.ebitda),
        holdPeriod: input.holdPeriod || null,
        investmentThesis: input.investmentThesis || null,
        risks: input.risks || null,
        purchasePrice: parseNumericField(input.purchasePrice),
        debt: parseNumericField(input.debt),
        sponsorEquity: parseNumericField(input.sponsorEquity),
        lpEquity: parseNumericField(input.lpEquity),
        status: input.status || "draft",
        launchDate: input.launchDate ? new Date(input.launchDate) : null,
        closeDate: input.closeDate ? new Date(input.closeDate) : null,
      };

      try {
        const [newDeal] = await ctx.db.transaction(async (tx) => {
          const insertedDeals = await tx
            .insert(deal)
            .values(dealData)
            .returning();
          const insertedDeal = insertedDeals[0];

          await tx.insert(sideEffectOutbox).values({
            id: randomUUID(),
            topic: "queue",
            dedupeKey: `deal:create:${dealId}`,
            payload: makeOutboxPayload("create-deal", `create-deal:${dealId}`, {
              deal: {
                name: input.name,
                slug: slug,
              },
            }),
          });

          return [insertedDeal];
        });

        await dispatchPendingOutbox(ctx.db);

        return {
          success: true,
          deal: newDeal,
          message: "Deal created successfully",
        };
      } catch (error) {
        // Handle invalid numeric values
        if (
          error instanceof Error &&
          (error.message.includes("invalid input") ||
            error.message.includes("numeric"))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "One or more numeric fields contain invalid values. Please check your input.",
            cause: error,
          });
        }

        // Handle unique constraint violations
        if (
          error instanceof Error &&
          (error.message.includes("unique") ||
            error.message.includes("duplicate") ||
            error.message.includes("23505"))
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists. Please try again.",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create deal",
          cause: error,
        });
      }
    }),

  update: adminProcedure
    .input(
      createDealSchema.extend({
        dealId: z.string().min(1, "Deal ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { dealId, ...updateData } = input;

      // Check if deal exists and get existing deal in parallel with slug check prep
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Generate slug from name
      const slug = slugify(updateData.name, { lower: true, strict: true });

      // If slug is being updated, check for conflicts
      if (slug !== existingDeal.slug) {
        const [conflictingDeal] = await ctx.db
          .select()
          .from(deal)
          .where(eq(deal.slug, slug))
          .limit(1);

        if (conflictingDeal) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists",
          });
        }
      }

      // Prepare update data
      const dealUpdateData = {
        name: updateData.name,
        slug: slug,
        description: updateData.description || null,
        teaserSummary: updateData.teaserSummary || null,
        sector: updateData.sector || null,
        geography: updateData.geography || null,
        dealType: updateData.dealType || null,
        targetRaise: parseNumericField(updateData.targetRaise),
        minInvestment: parseNumericField(updateData.minInvestment),
        targetIrr: parseNumericField(updateData.targetIrr),
        targetMoic: parseNumericField(updateData.targetMoic),
        targetCompany: updateData.targetCompany || null,
        revenue: parseNumericField(updateData.revenue),
        ebitda: parseNumericField(updateData.ebitda),
        holdPeriod: updateData.holdPeriod || null,
        investmentThesis: updateData.investmentThesis || null,
        risks: updateData.risks || null,
        purchasePrice: parseNumericField(updateData.purchasePrice),
        debt: parseNumericField(updateData.debt),
        sponsorEquity: parseNumericField(updateData.sponsorEquity),
        lpEquity: parseNumericField(updateData.lpEquity),
        status: updateData.status || "draft",
        launchDate: updateData.launchDate
          ? new Date(updateData.launchDate)
          : null,
        closeDate: updateData.closeDate ? new Date(updateData.closeDate) : null,
      };

      try {
        const [updatedDeal] = await ctx.db.transaction(async (tx) => {
          const updatedDeals = await tx
            .update(deal)
            .set(dealUpdateData)
            .where(eq(deal.id, dealId))
            .returning();
          const nextDeal = updatedDeals[0];

          // Check if deal name changed and enqueue folder rename job
          if (existingDeal.name !== updateData.name) {
            await tx.insert(sideEffectOutbox).values({
              id: randomUUID(),
              topic: "queue",
              dedupeKey: `deal:rename:${dealId}:${slugify(updateData.name, {
                lower: true,
                strict: true,
              })}`,
              payload: makeOutboxPayload(
                "rename-deal",
                `rename-deal:${dealId}:${slugify(updateData.name, {
                  lower: true,
                  strict: true,
                })}`,
                {
                  oldDealName: existingDeal.name,
                  newDealName: updateData.name,
                }
              ),
            });
          }

          return [nextDeal];
        });

        await dispatchPendingOutbox(ctx.db);

        return {
          success: true,
          deal: updatedDeal,
          message: "Deal updated successfully",
        };
      } catch (error) {
        // Handle invalid numeric values
        if (
          error instanceof Error &&
          (error.message.includes("invalid input") ||
            error.message.includes("numeric"))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "One or more numeric fields contain invalid values. Please check your input.",
            cause: error,
          });
        }

        // Handle unique constraint violations
        if (
          error instanceof Error &&
          (error.message.includes("unique") ||
            error.message.includes("duplicate") ||
            error.message.includes("23505"))
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists. Please try again.",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to update deal",
          cause: error,
        });
      }
    }),

  remove: adminProcedure
    .input(
      z.object({
        dealId: z.string().min(1, "Deal ID is required"),
        reason: z
          .string()
          .trim()
          .min(5, "Please provide a reason (min 5 characters)"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if deal exists
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (existingDeal.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This deal is already deleted",
        });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(deal)
            .set({
              deletedAt: new Date(),
              deletedBy: ctx.session.user.id,
              deletedReason: input.reason,
              updatedAt: new Date(),
            })
            .where(eq(deal.id, input.dealId));

          await tx.insert(auditLog).values({
            id: randomUUID(),
            userId: ctx.session.user.id,
            action: "deal_deleted",
            targetType: "deal",
            targetId: input.dealId,
            newValue: { reason: input.reason, dealName: existingDeal.name },
          });
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete deal",
          cause: error,
        });
      }

      return {
        success: true,
        message: "Deal deleted successfully",
      };
    }),

  restore: adminProcedure
    .input(z.object({ dealId: z.string().min(1, "Deal ID is required") }))
    .mutation(async ({ input, ctx }) => {
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!existingDeal.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This deal is not deleted",
        });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(deal)
            .set({
              deletedAt: null,
              deletedBy: null,
              deletedReason: null,
              updatedAt: new Date(),
            })
            .where(eq(deal.id, input.dealId));

          await tx.insert(auditLog).values({
            id: randomUUID(),
            userId: ctx.session.user.id,
            action: "deal_restored",
            targetType: "deal",
            targetId: input.dealId,
            newValue: { dealName: existingDeal.name },
          });
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to restore deal",
          cause: error,
        });
      }

      return {
        success: true,
        message: "Deal restored successfully",
      };
    }),

  purge: adminProcedure
    .input(z.object({ dealId: z.string().min(1, "Deal ID is required") }))
    .mutation(async ({ input, ctx }) => {
      // Check if deal exists
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // A deal with any engagement cannot be physically removed — the FK graph
      // (investments RESTRICT, chats/capital notices NO ACTION) enforces this.
      const [investmentCount, chatCount, noticeCount] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(investment)
          .where(eq(investment.dealId, input.dealId))
          .then(([row]) => Number(row?.count ?? 0)),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(chat)
          .where(eq(chat.dealId, input.dealId))
          .then(([row]) => Number(row?.count ?? 0)),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(capitalNotice)
          .where(eq(capitalNotice.dealId, input.dealId))
          .then(([row]) => Number(row?.count ?? 0)),
      ]);

      if (investmentCount > 0 || chatCount > 0 || noticeCount > 0) {
        const blockers: string[] = [];
        if (investmentCount > 0) {
          blockers.push(`${investmentCount} investment(s)`);
        }
        if (chatCount > 0) {
          blockers.push(`${chatCount} chat(s)`);
        }
        if (noticeCount > 0) {
          blockers.push(`${noticeCount} capital notice(s)`);
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot permanently delete this deal because it has ${blockers.join(", ")}. Delete those records first, or soft-delete the deal instead.`,
        });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          // Delete first to ensure state is committed before cleanup is scheduled.
          await tx.delete(deal).where(eq(deal.id, input.dealId));

          await tx.insert(sideEffectOutbox).values({
            id: randomUUID(),
            topic: "queue",
            dedupeKey: `deal:delete:${input.dealId}`,
            payload: makeOutboxPayload(
              "delete-deal",
              `delete-deal:${input.dealId}`,
              {
                dealName: existingDeal.name,
              }
            ),
          });

          await tx.insert(auditLog).values({
            id: randomUUID(),
            userId: ctx.session.user.id,
            action: "deal_purged",
            targetType: "deal",
            targetId: input.dealId,
            newValue: { dealName: existingDeal.name },
          });
        });

        await dispatchPendingOutbox(ctx.db);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete deal",
          cause: error,
        });
      }

      return {
        success: true,
        message: "Deal permanently deleted",
      };
    }),

  deleteFile: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        path: z.string().min(1, "File path is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await dealFileStore.delete(input.dealId, input.path);
        return {
          success: true as const,
          message: "File deleted successfully",
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found in Nextcloud",
          });
        }
        if (error instanceof Error && error.message === "Invalid file path") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file path",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete file",
          cause: error,
        });
      }
    }),

  listFolder: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        relativePath: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await dealFileStore.listFolder(
          input.dealId,
          input.relativePath,
        );
      } catch (error) {
        if (error instanceof Error && error.message === "Invalid folder path") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid folder path",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list folder",
          cause: error,
        });
      }
    }),

  getMarketplaceDeals: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        status: z.string().optional(),
        sector: z.string().optional(),
        geography: z.string().optional(),
        dealType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return getMarketplaceDealsQuery({
        userId: ctx.session.user.id,
        page: input.page,
        limit: input.limit,
        search: input.search,
        status: input.status,
        sector: input.sector,
        geography: input.geography,
        dealType: input.dealType,
      });
    }),

  requestDataRoomAccess: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        message: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;

      const [dealRecord] = await ctx.db
        .select({
          id: deal.id,
          name: deal.name,
          status: deal.status,
          deletedAt: deal.deletedAt,
        })
        .from(deal)
        .where(or(eq(deal.id, input.dealId), eq(deal.slug, input.dealId)))
        .limit(1);

      if (!dealRecord || dealRecord.status === "draft" || dealRecord.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const [invitation] = await ctx.db
        .select({
          id: vehiclePermission.id,
          accessLevel: vehiclePermission.accessLevel,
          dataRoomRequestedAt: vehiclePermission.dataRoomRequestedAt,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, session.user.id),
            eq(vehiclePermission.dealId, dealRecord.id),
            isNull(vehiclePermission.revokedAt)
          )
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal",
        });
      }

      if (invitation.accessLevel === "data_room") {
        return {
          success: true,
          message: "You already have data room access",
          alreadyHasAccess: true,
          alreadyRequested: false,
        };
      }

      if (invitation.dataRoomRequestedAt) {
        return {
          success: true,
          message: "Your data room access request is already pending review.",
          alreadyHasAccess: false,
          alreadyRequested: true,
        };
      }

      await ctx.db
        .update(vehiclePermission)
        .set({
          dataRoomRequestedAt: new Date(),
          dataRoomRequestMessage: input.message || null,
        })
        .where(eq(vehiclePermission.id, invitation.id));

      await logDataRoomAccessRequest({
        performedBy: session.user.id,
        dealId: dealRecord.id,
        notes: input.message || null,
      });

      return {
        success: true,
        message: "Data room access requested. An administrator will review.",
        alreadyHasAccess: false,
        alreadyRequested: false,
      };
    }),

  expressInterest: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        // soft_committed / meeting_requested accepted for backward compat;
        // investor UI only writes interested | pass.
        status: z.enum([
          "interested",
          "soft_committed",
          "pass",
          "meeting_requested",
        ]),
        proposedAmount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;

      // Verify deal exists (by ID or slug)
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(or(eq(deal.id, input.dealId), eq(deal.slug, input.dealId)))
        .limit(1);

      const actualDealId = dealRecord?.id || input.dealId;

      if (!dealRecord || dealRecord.status === "draft" || dealRecord.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (session.user.role === "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Admins cannot express interest. Use Admin → Deals to manage this deal.",
        });
      }

      // Require data room invitation to express interest
      const [invitation] = await ctx.db
        .select({ accessLevel: vehiclePermission.accessLevel })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, session.user.id),
            eq(vehiclePermission.dealId, actualDealId),
            isNull(vehiclePermission.revokedAt)
          )
        )
        .limit(1);

      if (!invitation || invitation.accessLevel !== "data_room") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Data room access is required to express interest",
        });
      }

      // Normalize legacy soft_commit / meeting → interested; keep pass.
      const normalizedStatus =
        input.status === "pass" ? "pass" : "interested";
      const proposedAmount =
        normalizedStatus === "pass" ? null : (input.proposedAmount ?? null);

      // Try insert first; if already present, update existing row.
      const [newInterest] = await ctx.db
        .insert(dealInterest)
        .values({
          id: randomUUID(),
          dealId: actualDealId,
          userId: session.user.id,
          status: normalizedStatus,
          proposedAmount,
        })
        .onConflictDoNothing()
        .returning();

      if (newInterest) {
        return {
          success: true,
          interest: {
            ...newInterest,
            proposedAmount: newInterest.proposedAmount?.toString() ?? null,
            createdAt: newInterest.createdAt.toISOString(),
            updatedAt: newInterest.updatedAt?.toISOString() ?? null,
          },
          message: "Interest expressed successfully",
        };
      }

      const [updatedInterest] = await ctx.db
        .update(dealInterest)
        .set({
          status: normalizedStatus,
          proposedAmount,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dealInterest.dealId, actualDealId),
            eq(dealInterest.userId, session.user.id)
          )
        )
        .returning();

      if (!updatedInterest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to persist interest",
        });
      }

      return {
        success: true,
        interest: {
          ...updatedInterest,
          proposedAmount: updatedInterest.proposedAmount?.toString() ?? null,
          createdAt: updatedInterest.createdAt.toISOString(),
          updatedAt: updatedInterest.updatedAt?.toISOString() ?? null,
        },
        message: "Interest updated successfully",
      };
    }),
});

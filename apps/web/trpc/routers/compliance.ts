/**
 * Compliance Router
 *
 * Handles investor approval status, deal invitations,
 * and audit log retrieval for compliance operations.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../init";
import {
  user,
  onboarding,
  investorClearance,
  vehiclePermission,
  auditLog,
  deal,
  onboardingDocument,
} from "@repo/db/schema";
import {
  eq,
  desc,
  and,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { after } from "@/lib/helpers/after-response";
import {
  logClearanceChange,
  logPermissionGrant,
  logPermissionRevoke,
} from "@/lib/audit";

// Global investor approval status
const clearanceStatusSchema = z.enum([
  "pending_review",
  "approved",
  "needs_information",
  "rejected",
]);

const dealAccessLevelSchema = z.enum(["teaser", "data_room"]);

const isApprovedStatus = (status: string): status is "approved" => {
  return status === "approved";
};

export const complianceRouter = createTRPCRouter({
  /**
   * Set investor clearance status
   */
  setClearance: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: clearanceStatusSchema,
        conditions: z.array(z.string()).optional(),
        notes: z.string().optional(),
        investorVisibleNotes: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;

      const [investor, previousClearance] = await Promise.all([
        ctx.db
          .select({
            id: user.id,
            isOnboardingCompleted: user.isOnboardingCompleted,
          })
          .from(user)
          .where(eq(user.id, input.userId))
          .limit(1)
          .then((r) => r[0]),
        ctx.db
          .select({ status: investorClearance.status })
          .from(investorClearance)
          .where(eq(investorClearance.userId, input.userId))
          .orderBy(desc(investorClearance.createdAt))
          .limit(1)
          .then((r) => r[0]),
      ]);

      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor not found",
        });
      }

      if (isApprovedStatus(input.status) && !investor.isOnboardingCompleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot approve investor: onboarding/KYC is not complete. " +
            "The investor must complete onboarding before approval.",
        });
      }

      const clearedAt = isApprovedStatus(input.status) ? new Date() : null;
      const clearanceId = nanoid();

      await ctx.db.insert(investorClearance).values({
        id: clearanceId,
        userId: input.userId,
        status: input.status,
        conditions:
          input.conditions && input.conditions.length > 0
            ? input.conditions.join("; ")
            : null,
        conditionsJson:
          input.conditions && input.conditions.length > 0
            ? input.conditions
            : null,
        clearedBy: session.user.id,
        clearedAt,
        notes: input.notes || null,
        investorVisibleNotes: input.investorVisibleNotes || null,
        expiresAt: input.expiresAt || null,
      });

      after(async () => {
        await logClearanceChange({
          performedBy: session.user.id,
          targetUserId: input.userId,
          previousStatus: previousClearance?.status || null,
          newStatus: input.status,
          conditions: input.conditions || null,
          notes: input.notes || null,
        });
      });

      return {
        success: true,
        clearanceId,
        message: `Investor status updated to ${input.status}`,
      };
    }),

  /**
   * Invite investor to a deal (or update invitation access level)
   */
  inviteToDeal: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        accessLevel: dealAccessLevelSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;

      // Require approved global status
      const [clearance] = await ctx.db
        .select({ status: investorClearance.status })
        .from(investorClearance)
        .where(eq(investorClearance.userId, input.userId))
        .orderBy(desc(investorClearance.createdAt))
        .limit(1);

      if (!clearance || !isApprovedStatus(clearance.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Investor must be approved before inviting to a deal",
        });
      }

      const [dealRecord] = await ctx.db
        .select({ id: deal.id, name: deal.name })
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Upsert: update existing active invitation, or un-revoke, or insert
      const [existing] = await ctx.db
        .select({
          id: vehiclePermission.id,
          revokedAt: vehiclePermission.revokedAt,
          accessLevel: vehiclePermission.accessLevel,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, input.userId),
            eq(vehiclePermission.dealId, input.dealId)
          )
        )
        .limit(1);

      let invitationId: string;

      // Granting data room clears any pending upgrade request
      const clearRequest =
        input.accessLevel === "data_room"
          ? {
              dataRoomRequestedAt: null as Date | null,
              dataRoomRequestMessage: null as string | null,
            }
          : {};

      if (existing) {
        await ctx.db
          .update(vehiclePermission)
          .set({
            accessLevel: input.accessLevel,
            grantedBy: session.user.id,
            grantedAt: new Date(),
            notes: input.notes || null,
            revokedAt: null,
            revokedBy: null,
            revokeReason: null,
            ...clearRequest,
          })
          .where(eq(vehiclePermission.id, existing.id));
        invitationId = existing.id;
      } else {
        invitationId = nanoid();
        await ctx.db.insert(vehiclePermission).values({
          id: invitationId,
          userId: input.userId,
          dealId: input.dealId,
          accessLevel: input.accessLevel,
          grantedBy: session.user.id,
          notes: input.notes || null,
        });
      }

      after(async () => {
        await logPermissionGrant({
          performedBy: session.user.id,
          targetUserId: input.userId,
          dealId: input.dealId,
          accessLevel: input.accessLevel,
          notes: input.notes || `Invited to ${dealRecord.name}`,
        });
      });

      return {
        success: true,
        invitationId,
        message: `Invited to deal at ${input.accessLevel} access`,
      };
    }),

  /**
   * Withdraw deal invitation (soft revoke)
   */
  withdrawInvitation: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;

      const [existingPermission] = await ctx.db
        .select({ id: vehiclePermission.id })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, input.userId),
            eq(vehiclePermission.dealId, input.dealId),
            isNull(vehiclePermission.revokedAt)
          )
        )
        .limit(1);

      if (!existingPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active invitation found to withdraw",
        });
      }

      await ctx.db
        .update(vehiclePermission)
        .set({
          revokedAt: new Date(),
          revokedBy: session.user.id,
          revokeReason: input.reason || null,
        })
        .where(eq(vehiclePermission.id, existingPermission.id));

      after(async () => {
        await logPermissionRevoke({
          performedBy: session.user.id,
          targetUserId: input.userId,
          dealId: input.dealId,
          reason: input.reason || null,
        });
      });

      return {
        success: true,
        message: "Invitation withdrawn",
      };
    }),


  reviewDocument: adminProcedure
    .input(
      z.object({
        documentId: z.string(),
        status: z.enum([
          "pending",
          "approved",
          "rejected",
          "incorrect_doc",
          "needs_revision",
        ]),
        reviewNotes: z.string().optional(),
        investorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;

      // Get the document to verify it exists and get previous status
      const [existingDoc] = await ctx.db
        .select({
          id: onboardingDocument.id,
          status: onboardingDocument.status,
          onboardingId: onboardingDocument.onboardingId,
        })
        .from(onboardingDocument)
        .where(eq(onboardingDocument.id, input.documentId))
        .limit(1);

      if (!existingDoc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Update the document status
      await ctx.db
        .update(onboardingDocument)
        .set({
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(eq(onboardingDocument.id, input.documentId));

      // Get the onboarding to find the user for audit log
      const [onboardingData] = await ctx.db
        .select({ userId: onboarding.userId })
        .from(onboarding)
        .where(eq(onboarding.id, existingDoc.onboardingId))
        .limit(1);

      // Log the audit event after response is sent
      after(async () => {
        await ctx.db.insert(auditLog).values({
          id: nanoid(),
          userId: session.user.id,
          action: "document_reviewed",
          targetType: "document",
          targetId: input.documentId,
          previousValue: { status: existingDoc.status },
          newValue: { status: input.status, notes: input.reviewNotes },
          metadata: {
            onboardingId: existingDoc.onboardingId,
            investorId: onboardingData?.userId,
          },
        });
      });

      return {
        success: true,
        message: `Document status updated to ${input.status}`,
      };
    }),

  /**
   * Bulk review documents - approve/reject multiple at once
   */
  bulkReviewDocuments: adminProcedure
    .input(
      z.object({
        documentIds: z.array(z.string()),
        status: z.enum([
          "pending",
          "approved",
          "rejected",
          "incorrect_doc",
          "needs_revision",
        ]),
        investorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;

      const { documentIds, status } = input;

      // Update all documents
      for (const docId of documentIds) {
        await ctx.db
          .update(onboardingDocument)
          .set({
            status,
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          })
          .where(eq(onboardingDocument.id, docId));
      }

      return {
        success: true,
        message: `${documentIds.length} document(s) updated to ${status}`,
        updatedCount: documentIds.length,
      };
    }),


});

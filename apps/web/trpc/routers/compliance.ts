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
  onboardingEditHistory,
  investorClearance,
  vehiclePermission,
  auditLog,
  deal,
  beneficialOwner,
  authorizedSignatory,
  kycAttestation,
  onboardingDocument,
} from "@repo/db/schema";
import {
  eq,
  desc,
  and,
  isNull,
  ne,
  or,
  sql,
  ilike,
  inArray,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { after } from "@/lib/helpers/after-response";
import {
  logClearanceChange,
  logPermissionGrant,
  logPermissionRevoke,
} from "@/lib/audit";
import { authSession } from "@/lib/auth/session-from-request";

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
   * Get investors pending compliance review
   */
  getPendingInvestors: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        clearanceStatus: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, clearanceStatus } = input;
      const offset = (page - 1) * limit;

      // Latest clearance timestamp per user
      const latestClearanceTimestamps = ctx.db
        .select({
          userId: investorClearance.userId,
          maxCreatedAt:
            sql<(typeof investorClearance.$inferSelect)["createdAt"]>`max(${investorClearance.createdAt})`.as(
              "max_created_at"
            ),
        })
        .from(investorClearance)
        .groupBy(investorClearance.userId)
        .as("latest_clearance_timestamps");

      // Latest clearance row per user
      const latestClearance = ctx.db
        .select({
          userId: investorClearance.userId,
          status: investorClearance.status,
          conditions: investorClearance.conditions,
          conditionsJson: investorClearance.conditionsJson,
          clearedAt: investorClearance.clearedAt,
          clearedBy: investorClearance.clearedBy,
        })
        .from(investorClearance)
        .innerJoin(
          latestClearanceTimestamps,
          and(
            eq(investorClearance.userId, latestClearanceTimestamps.userId),
            eq(
              investorClearance.createdAt,
              latestClearanceTimestamps.maxCreatedAt
            )
          )
        )
        .as("latest_clearance");

      // Get users who have completed onboarding but may need clearance review
      const conditions = [
        or(ne(user.role, "admin"), isNull(user.role)),
        eq(user.isOnboardingCompleted, true),
      ];

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push(
          or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!
        );
      }

      if (clearanceStatus && clearanceStatus !== "all") {
        if (clearanceStatus === "no_clearance") {
          conditions.push(isNull(latestClearance.status));
        } else {
          const parsedClearanceStatus =
            clearanceStatusSchema.safeParse(clearanceStatus);
          if (parsedClearanceStatus.success) {
            conditions.push(
              eq(latestClearance.status, parsedClearanceStatus.data)
            );
          } else {
            // Preserve previous behavior for unknown status filters (no rows).
            conditions.push(sql`1 = 0`);
          }
        }
      }

      const whereCondition = and(...conditions);

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .leftJoin(latestClearance, eq(user.id, latestClearance.userId))
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get users with their latest clearance status
      const investors = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          isOnboardingCompleted: user.isOnboardingCompleted,
          clearanceStatus: latestClearance.status,
          clearanceConditions: latestClearance.conditions,
          clearanceConditionsJson: latestClearance.conditionsJson,
          clearanceClearedAt: latestClearance.clearedAt,
          clearanceClearedBy: latestClearance.clearedBy,
        })
        .from(user)
        .leftJoin(latestClearance, eq(user.id, latestClearance.userId))
        .where(whereCondition)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset);

      const investorIds = investors.map((investor) => investor.id);
      const permissionCounts =
        investorIds.length > 0
          ? await ctx.db
            .select({
              userId: vehiclePermission.userId,
              count: sql<number>`count(*)::int`,
            })
            .from(vehiclePermission)
            .where(
              and(
                inArray(vehiclePermission.userId, investorIds),
                isNull(vehiclePermission.revokedAt)
              )
            )
            .groupBy(vehiclePermission.userId)
          : [];

      const permissionCountByUserId = new Map(
        permissionCounts.map((row) => [row.userId, row.count])
      );

      const investorsWithClearance = investors.map((investor) => ({
        id: investor.id,
        name: investor.name,
        email: investor.email,
        image: investor.image,
        createdAt: investor.createdAt,
        isOnboardingCompleted: investor.isOnboardingCompleted,
        clearance: investor.clearanceStatus
          ? {
            status: investor.clearanceStatus,
            conditions: investor.clearanceConditions,
            conditionsJson: investor.clearanceConditionsJson,
            clearedAt: investor.clearanceClearedAt,
            clearedBy: investor.clearanceClearedBy,
          }
          : null,
        dealAccessCount: permissionCountByUserId.get(investor.id) ?? 0,
      }));

      return {
        success: true,
        investors: investorsWithClearance,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      };
    }),

  /**
   * Get a single investor's compliance details
   */
  getInvestorDetails: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get user details
      const [investor] = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          isOnboardingCompleted: user.isOnboardingCompleted,
        })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor not found",
        });
      }

      // Get onboarding data
      const [onboardingData] = await ctx.db
        .select()
        .from(onboarding)
        .where(eq(onboarding.userId, input.userId))
        .orderBy(desc(onboarding.createdAt))
        .limit(1);

      // Get additional onboarding-related data if onboarding exists
      let beneficialOwners: (typeof beneficialOwner.$inferSelect)[] = [];
      let authorizedSignatories: (typeof authorizedSignatory.$inferSelect)[] =
        [];
      let attestations: (typeof kycAttestation.$inferSelect)[] = [];
      let documents: (typeof onboardingDocument.$inferSelect)[] = [];
      let editHistory: (typeof onboardingEditHistory.$inferSelect)[] = [];

      if (onboardingData) {
        beneficialOwners = await ctx.db
          .select()
          .from(beneficialOwner)
          .where(eq(beneficialOwner.onboardingId, onboardingData.id))
          .orderBy(beneficialOwner.createdAt);

        authorizedSignatories = await ctx.db
          .select()
          .from(authorizedSignatory)
          .where(eq(authorizedSignatory.onboardingId, onboardingData.id))
          .orderBy(authorizedSignatory.createdAt);

        attestations = await ctx.db
          .select()
          .from(kycAttestation)
          .where(eq(kycAttestation.onboardingId, onboardingData.id))
          .orderBy(kycAttestation.createdAt);

        documents = await ctx.db
          .select()
          .from(onboardingDocument)
          .where(eq(onboardingDocument.onboardingId, onboardingData.id))
          .orderBy(desc(onboardingDocument.uploadedAt));

        // Get edit history for the onboarding (most recent first)
        editHistory = await ctx.db
          .select()
          .from(onboardingEditHistory)
          .where(eq(onboardingEditHistory.onboardingId, onboardingData.id))
          .orderBy(desc(onboardingEditHistory.editedAt))
          .limit(50);
      }

      // Get clearance history (most recent first)
      const clearanceHistory = await ctx.db
        .select({
          id: investorClearance.id,
          status: investorClearance.status,
          conditions: investorClearance.conditions,
          conditionsJson: investorClearance.conditionsJson,
          clearedBy: investorClearance.clearedBy,
          clearedAt: investorClearance.clearedAt,
          notes: investorClearance.notes,
          investorVisibleNotes: investorClearance.investorVisibleNotes,
          createdAt: investorClearance.createdAt,
        })
        .from(investorClearance)
        .where(eq(investorClearance.userId, input.userId))
        .orderBy(desc(investorClearance.createdAt));

      // Get current clearance (most recent)
      const currentClearance = clearanceHistory[0] || null;

      // Get active deal invitations with deal names
      const permissionsRaw = await ctx.db
        .select({
          id: vehiclePermission.id,
          dealId: vehiclePermission.dealId,
          accessLevel: vehiclePermission.accessLevel,
          grantedAt: vehiclePermission.grantedAt,
          grantedBy: vehiclePermission.grantedBy,
          notes: vehiclePermission.notes,
          dataRoomRequestedAt: vehiclePermission.dataRoomRequestedAt,
          dataRoomRequestMessage: vehiclePermission.dataRoomRequestMessage,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, input.userId),
            isNull(vehiclePermission.revokedAt)
          )
        )
        .orderBy(desc(vehiclePermission.grantedAt));

      // Add deal names and granter names to permissions
      const permissions = await Promise.all(
        permissionsRaw.map(async (perm) => {
          const [dealInfo] = await ctx.db
            .select({ name: deal.name })
            .from(deal)
            .where(eq(deal.id, perm.dealId))
            .limit(1);

          let grantedByName = null;
          if (perm.grantedBy) {
            const [granter] = await ctx.db
              .select({ name: user.name })
              .from(user)
              .where(eq(user.id, perm.grantedBy))
              .limit(1);
            grantedByName = granter?.name || null;
          }

          return {
            ...perm,
            dealName: dealInfo?.name || "Unknown Deal",
            grantedByName,
          };
        })
      );

      // Get audit log entries for this investor
      const auditLogEntries = await ctx.db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          targetType: auditLog.targetType,
          targetId: auditLog.targetId,
          previousValue: auditLog.previousValue,
          newValue: auditLog.newValue,
          metadata: auditLog.metadata,
          userId: auditLog.userId,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(
          or(
            eq(auditLog.targetId, input.userId),
            sql`${auditLog.targetId} LIKE ${input.userId + ":%"}`
          )
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(50);

      // Add performer names to audit entries
      const auditLogWithNames = await Promise.all(
        auditLogEntries.map(async (entry) => {
          let performedByName = "System";
          if (entry.userId) {
            const [performer] = await ctx.db
              .select({ name: user.name })
              .from(user)
              .where(eq(user.id, entry.userId))
              .limit(1);
            performedByName = performer?.name || "Unknown User";
          }
          return {
            ...entry,
            performedByName,
          };
        })
      );

      // Combine investor with current clearance
      const investorWithClearance = {
        ...investor,
        clearance: currentClearance,
      };

      // Combine onboarding with related data
      const onboardingWithRelations = onboardingData
        ? {
          ...onboardingData,
          beneficialOwners,
          authorizedSignatories,
          attestations,
          documents,
          editHistory,
        }
        : null;

      return {
        success: true,
        investor: investorWithClearance,
        onboarding: onboardingWithRelations,
        clearanceHistory,
        permissions,
        auditLog: auditLogWithNames,
      };
    }),

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
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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

  /** @deprecated Prefer inviteToDeal */
  grantVehicleAccess: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        accessLevel: dealAccessLevelSchema.optional(),
        permissions: z
          .object({
            canViewTeaser: z.boolean().optional(),
            canViewDocuments: z.boolean().optional(),
            canExpressInterest: z.boolean().optional(),
            canInvest: z.boolean().optional(),
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const accessLevel =
        input.accessLevel ??
        (input.permissions?.canViewDocuments || input.permissions?.canInvest
          ? "data_room"
          : "teaser");

      // Delegate to inviteToDeal logic via internal call pattern — inline re-use
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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

      const [existing] = await ctx.db
        .select({ id: vehiclePermission.id })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, input.userId),
            eq(vehiclePermission.dealId, input.dealId)
          )
        )
        .limit(1);

      let invitationId: string;
      if (existing) {
        await ctx.db
          .update(vehiclePermission)
          .set({
            accessLevel,
            grantedBy: session.user.id,
            grantedAt: new Date(),
            notes: input.notes || null,
            revokedAt: null,
            revokedBy: null,
            revokeReason: null,
          })
          .where(eq(vehiclePermission.id, existing.id));
        invitationId = existing.id;
      } else {
        invitationId = nanoid();
        await ctx.db.insert(vehiclePermission).values({
          id: invitationId,
          userId: input.userId,
          dealId: input.dealId,
          accessLevel,
          grantedBy: session.user.id,
          notes: input.notes || null,
        });
      }

      after(async () => {
        await logPermissionGrant({
          performedBy: session.user.id,
          targetUserId: input.userId,
          dealId: input.dealId,
          accessLevel,
          notes: input.notes || null,
        });
      });

      return {
        success: true,
        permissionId: invitationId,
        message: "Deal invitation set",
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
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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

  revokeVehicleAccess: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Find the active permission
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
          message: "No active permission found to revoke",
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

      // Log permission revoke after response is sent
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

  /**
   * Get audit log for a user or globally
   */
  getAuditLog: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        targetId: z.string().optional(),
        action: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {


      const { page, limit, userId, targetId, action } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (userId) {
        conditions.push(eq(auditLog.userId, userId));
      }
      if (targetId) {
        conditions.push(eq(auditLog.targetId, targetId));
      }
      if (action) {
        conditions.push(eq(auditLog.action, action as any));
      }

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countQuery = ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog);
      if (whereCondition) {
        countQuery.where(whereCondition);
      }
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get audit logs
      const logsQuery = ctx.db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          targetType: auditLog.targetType,
          targetId: auditLog.targetId,
          previousValue: auditLog.previousValue,
          newValue: auditLog.newValue,
          metadata: auditLog.metadata,
          ipAddress: auditLog.ipAddress,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset);

      if (whereCondition) {
        logsQuery.where(whereCondition);
      }

      const logs = await logsQuery;

      // Get user names for display
      const logsWithUsers = await Promise.all(
        logs.map(async (log) => {
          let performedByName = "System";
          if (log.userId) {
            const [performer] = await ctx.db
              .select({ name: user.name })
              .from(user)
              .where(eq(user.id, log.userId))
              .limit(1);
            performedByName = performer?.name || "Unknown User";
          }
          return {
            ...log,
            performedByName,
          };
        })
      );

      return {
        success: true,
        logs: logsWithUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      };
    }),


  /**
   * Grant deal access to all cleared investors
   * Use this when publishing a new deal to auto-grant access
   */
  /**
   * Invite all approved investors to a deal at a given access level
   */
  inviteAllApprovedToDeal: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        accessLevel: dealAccessLevelSchema.default("teaser"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const [dealRecord] = await ctx.db
        .select({ id: deal.id, name: deal.name, status: deal.status })
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const latestClearanceTimestamps = ctx.db
        .select({
          userId: investorClearance.userId,
          maxCreatedAt:
            sql<(typeof investorClearance.$inferSelect)["createdAt"]>`max(${investorClearance.createdAt})`.as(
              "max_created_at"
            ),
        })
        .from(investorClearance)
        .groupBy(investorClearance.userId)
        .as("latest_clearance_timestamps_bulk_invite");

      const [approvedInvestorsRaw, existingInvitations] = await Promise.all([
        ctx.db
          .select({
            userId: investorClearance.userId,
            status: investorClearance.status,
          })
          .from(investorClearance)
          .innerJoin(
            latestClearanceTimestamps,
            and(
              eq(investorClearance.userId, latestClearanceTimestamps.userId),
              eq(
                investorClearance.createdAt,
                latestClearanceTimestamps.maxCreatedAt
              )
            )
          ),
        ctx.db
          .select({
            userId: vehiclePermission.userId,
          })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.dealId, input.dealId),
              isNull(vehiclePermission.revokedAt)
            )
          ),
      ]);

      const investorsToInvite = approvedInvestorsRaw.filter((inv) =>
        isApprovedStatus(inv.status)
      );

      const existingSet = new Set(existingInvitations.map((p) => p.userId));

      const records = investorsToInvite
        .filter((investor) => !existingSet.has(investor.userId))
        .map((investor) => ({
          id: nanoid(),
          userId: investor.userId,
          dealId: input.dealId,
          accessLevel: input.accessLevel,
          grantedBy: session.user.id,
          notes: `Bulk invite for deal: ${dealRecord.name}`,
        }));

      let grantedCount = 0;
      if (records.length > 0) {
        const inserted = await ctx.db
          .insert(vehiclePermission)
          .values(records)
          .onConflictDoNothing()
          .returning({ id: vehiclePermission.id });
        grantedCount = inserted.length;
      }

      const skippedCount = investorsToInvite.length - grantedCount;

      after(async () => {
        await ctx.db.insert(auditLog).values({
          id: nanoid(),
          userId: session.user.id,
          action: "permission_granted",
          targetType: "deal",
          targetId: input.dealId,
          newValue: {
            bulkInvite: true,
            grantedCount,
            skippedCount,
            accessLevel: input.accessLevel,
          },
          metadata: {
            dealName: dealRecord.name,
          },
        });
      });

      return {
        success: true,
        message: `Invited ${grantedCount} investors (${skippedCount} already invited)`,
        grantedCount,
        skippedCount,
      };
    }),

  /** @deprecated Prefer inviteAllApprovedToDeal */
  grantDealToAllClearedInvestors: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        accessLevel: dealAccessLevelSchema.default("teaser").optional(),
        permissions: z
          .object({
            canViewTeaser: z.boolean().optional(),
            canViewDocuments: z.boolean().optional(),
            canExpressInterest: z.boolean().optional(),
            canInvest: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const accessLevel =
        input.accessLevel ??
        (input.permissions?.canViewDocuments || input.permissions?.canInvest
          ? "data_room"
          : "teaser");

      // Re-implement thin wrapper by calling same logic path
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
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

      const latestClearanceTimestamps = ctx.db
        .select({
          userId: investorClearance.userId,
          maxCreatedAt:
            sql<(typeof investorClearance.$inferSelect)["createdAt"]>`max(${investorClearance.createdAt})`.as(
              "max_created_at"
            ),
        })
        .from(investorClearance)
        .groupBy(investorClearance.userId)
        .as("latest_clearance_timestamps_bulk_grant_compat");

      const [approvedInvestorsRaw, existingInvitations] = await Promise.all([
        ctx.db
          .select({
            userId: investorClearance.userId,
            status: investorClearance.status,
          })
          .from(investorClearance)
          .innerJoin(
            latestClearanceTimestamps,
            and(
              eq(investorClearance.userId, latestClearanceTimestamps.userId),
              eq(
                investorClearance.createdAt,
                latestClearanceTimestamps.maxCreatedAt
              )
            )
          ),
        ctx.db
          .select({ userId: vehiclePermission.userId })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.dealId, input.dealId),
              isNull(vehiclePermission.revokedAt)
            )
          ),
      ]);

      const investorsToInvite = approvedInvestorsRaw.filter((inv) =>
        isApprovedStatus(inv.status)
      );
      const existingSet = new Set(existingInvitations.map((p) => p.userId));
      const records = investorsToInvite
        .filter((inv) => !existingSet.has(inv.userId))
        .map((inv) => ({
          id: nanoid(),
          userId: inv.userId,
          dealId: input.dealId,
          accessLevel,
          grantedBy: session.user.id,
          notes: `Bulk invite for deal: ${dealRecord.name}`,
        }));

      let grantedCount = 0;
      if (records.length > 0) {
        const inserted = await ctx.db
          .insert(vehiclePermission)
          .values(records)
          .onConflictDoNothing()
          .returning({ id: vehiclePermission.id });
        grantedCount = inserted.length;
      }

      return {
        success: true,
        message: `Invited ${grantedCount} investors`,
        grantedCount,
        skippedCount: investorsToInvite.length - grantedCount,
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
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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
      const session = await authSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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

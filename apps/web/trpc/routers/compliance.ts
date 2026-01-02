/**
 * Compliance Router
 *
 * Handles investor clearance management, vehicle permissions,
 * and audit log retrieval for compliance operations.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "../init";
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
import { eq, desc, and, isNull, ne, or, sql, ilike } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { nanoid } from "nanoid";
import {
  logClearanceChange,
  logPermissionGrant,
  logPermissionRevoke,
} from "@/lib/audit";

// Clearance status types
const clearanceStatusSchema = z.enum([
  "pending",
  "cleared",
  "cleared_with_conditions",
  "rejected",
]);

export const complianceRouter = createTRPCRouter({
  /**
   * Get investors pending compliance review
   */
  getPendingInvestors: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        clearanceStatus: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const { page, limit, search, clearanceStatus } = input;
      const offset = (page - 1) * limit;

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

      const whereCondition = and(...conditions);

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
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
          kycStatus: user.kycStatus,
          isOnboardingCompleted: user.isOnboardingCompleted,
        })
        .from(user)
        .where(whereCondition)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset);

      // Get clearance status for each investor
      const investorsWithClearance = await Promise.all(
        investors.map(async (investor) => {
          const [clearance] = await ctx.db
            .select({
              status: investorClearance.status,
              conditions: investorClearance.conditions,
              conditionsJson: investorClearance.conditionsJson,
              clearedAt: investorClearance.clearedAt,
              clearedBy: investorClearance.clearedBy,
            })
            .from(investorClearance)
            .where(eq(investorClearance.userId, investor.id))
            .orderBy(desc(investorClearance.createdAt))
            .limit(1);

          return {
            ...investor,
            clearance: clearance || null,
          };
        })
      );

      // Filter by clearance status if provided
      let filteredInvestors = investorsWithClearance;
      if (clearanceStatus && clearanceStatus !== "all") {
        if (clearanceStatus === "no_clearance") {
          filteredInvestors = investorsWithClearance.filter(
            (inv) => !inv.clearance
          );
        } else {
          filteredInvestors = investorsWithClearance.filter(
            (inv) => inv.clearance?.status === clearanceStatus
          );
        }
      }

      return {
        success: true,
        investors: filteredInvestors,
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
  getInvestorDetails: baseProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get user details
      const [investor] = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          kycStatus: user.kycStatus,
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
      let beneficialOwners: typeof beneficialOwner.$inferSelect[] = [];
      let authorizedSignatories: typeof authorizedSignatory.$inferSelect[] = [];
      let attestations: typeof kycAttestation.$inferSelect[] = [];
      let documents: typeof onboardingDocument.$inferSelect[] = [];
      let editHistory: typeof onboardingEditHistory.$inferSelect[] = [];

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

      // Get vehicle permissions (only active ones) with deal names
      const permissionsRaw = await ctx.db
        .select({
          id: vehiclePermission.id,
          dealId: vehiclePermission.dealId,
          canViewTeaser: vehiclePermission.canViewTeaser,
          canViewDocuments: vehiclePermission.canViewDocuments,
          canExpressInterest: vehiclePermission.canExpressInterest,
          canInvest: vehiclePermission.canInvest,
          grantedAt: vehiclePermission.grantedAt,
          grantedBy: vehiclePermission.grantedBy,
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
  setClearance: baseProcedure
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
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get previous clearance status
      const [previousClearance] = await ctx.db
        .select({ status: investorClearance.status })
        .from(investorClearance)
        .where(eq(investorClearance.userId, input.userId))
        .orderBy(desc(investorClearance.createdAt))
        .limit(1);

      // Create new clearance record
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
        clearedAt:
          input.status === "cleared" || input.status === "cleared_with_conditions"
            ? new Date()
            : null,
        notes: input.notes || null,
        investorVisibleNotes: input.investorVisibleNotes || null,
        expiresAt: input.expiresAt || null,
      });

      // Log the audit event
      await logClearanceChange({
        performedBy: session.user.id,
        targetUserId: input.userId,
        previousStatus: previousClearance?.status || null,
        newStatus: input.status,
        conditions: input.conditions || null,
        notes: input.notes || null,
      });

      // Auto-grant vehicle permissions if cleared
      if (input.status === "cleared" || input.status === "cleared_with_conditions") {
        // Get all live deals (open for investment)
        const activeDeals = await ctx.db
          .select({ id: deal.id })
          .from(deal)
          .where(eq(deal.status, "live"));

        // Grant basic permissions to all active deals
        for (const activeDeal of activeDeals) {
          // Check if permission already exists
          const [existingPermission] = await ctx.db
            .select({ id: vehiclePermission.id })
            .from(vehiclePermission)
            .where(
              and(
                eq(vehiclePermission.userId, input.userId),
                eq(vehiclePermission.dealId, activeDeal.id),
                isNull(vehiclePermission.revokedAt)
              )
            )
            .limit(1);

          if (!existingPermission) {
            const permissionId = nanoid();
            await ctx.db.insert(vehiclePermission).values({
              id: permissionId,
              userId: input.userId,
              dealId: activeDeal.id,
              canViewTeaser: true,
              canViewDocuments: input.status === "cleared", // Full access only for cleared, not cleared_with_conditions
              canExpressInterest: true,
              canInvest: input.status === "cleared",
              grantedBy: session.user.id,
            });

            await logPermissionGrant({
              performedBy: session.user.id,
              targetUserId: input.userId,
              dealId: activeDeal.id,
              permissions: {
                canViewTeaser: true,
                canViewDocuments: input.status === "cleared",
                canExpressInterest: true,
                canInvest: input.status === "cleared",
              },
              notes: `Auto-granted on clearance: ${input.status}`,
            });
          }
        }
      }

      return {
        success: true,
        clearanceId,
        message: `Clearance status updated to ${input.status}`,
      };
    }),

  /**
   * Grant vehicle-specific permission
   */
  grantVehicleAccess: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        permissions: z.object({
          canViewTeaser: z.boolean().default(true),
          canViewDocuments: z.boolean().default(false),
          canExpressInterest: z.boolean().default(false),
          canInvest: z.boolean().default(false),
        }),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const { permissions } = input;

      // Check if permission already exists
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

      if (existingPermission) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Active permission already exists. Revoke it first to create a new one.",
        });
      }

      const permissionId = nanoid();
      await ctx.db.insert(vehiclePermission).values({
        id: permissionId,
        userId: input.userId,
        dealId: input.dealId,
        canViewTeaser: permissions.canViewTeaser,
        canViewDocuments: permissions.canViewDocuments,
        canExpressInterest: permissions.canExpressInterest,
        canInvest: permissions.canInvest,
        grantedBy: session.user.id,
        notes: input.notes || null,
      });

      await logPermissionGrant({
        performedBy: session.user.id,
        targetUserId: input.userId,
        dealId: input.dealId,
        permissions: {
          canViewTeaser: permissions.canViewTeaser,
          canViewDocuments: permissions.canViewDocuments,
          canExpressInterest: permissions.canExpressInterest,
          canInvest: permissions.canInvest,
        },
        notes: input.notes || null,
      });

      return {
        success: true,
        permissionId,
        message: "Vehicle access granted",
      };
    }),

  /**
   * Revoke vehicle-specific permission
   */
  revokeVehicleAccess: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        dealId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
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

      await logPermissionRevoke({
        performedBy: session.user.id,
        targetUserId: input.userId,
        dealId: input.dealId,
        reason: input.reason || null,
      });

      return {
        success: true,
        message: "Vehicle access revoked",
      };
    }),

  /**
   * Get audit log for a user or globally
   */
  getAuditLog: baseProcedure
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
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

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
   * Get current user's clearance status (for investor-facing view)
   */
  getMyClearance: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    const [clearance] = await ctx.db
      .select({
        status: investorClearance.status,
        conditions: investorClearance.conditions,
        conditionsJson: investorClearance.conditionsJson,
        clearedAt: investorClearance.clearedAt,
        investorVisibleNotes: investorClearance.investorVisibleNotes,
        expiresAt: investorClearance.expiresAt,
      })
      .from(investorClearance)
      .where(eq(investorClearance.userId, session.user.id))
      .orderBy(desc(investorClearance.createdAt))
      .limit(1);

    return {
      success: true,
      clearance: clearance || null,
    };
  }),

  /**
   * Get current user's vehicle permissions (for investor-facing view)
   */
  getMyPermissions: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    const permissions = await ctx.db
      .select({
        dealId: vehiclePermission.dealId,
        canViewTeaser: vehiclePermission.canViewTeaser,
        canViewDocuments: vehiclePermission.canViewDocuments,
        canExpressInterest: vehiclePermission.canExpressInterest,
        canInvest: vehiclePermission.canInvest,
        grantedAt: vehiclePermission.grantedAt,
      })
      .from(vehiclePermission)
      .where(
        and(
          eq(vehiclePermission.userId, session.user.id),
          isNull(vehiclePermission.revokedAt)
        )
      );

    // Get deal names
    const permissionsWithDeals = await Promise.all(
      permissions.map(async (perm) => {
        const [dealInfo] = await ctx.db
          .select({ name: deal.name })
          .from(deal)
          .where(eq(deal.id, perm.dealId))
          .limit(1);
        return {
          ...perm,
          dealName: dealInfo?.name || "Unknown Deal",
        };
      })
    );

    return {
      success: true,
      permissions: permissionsWithDeals,
    };
  }),

  /**
   * Get all available deals for permission granting
   */
  getAvailableDeals: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Admin access required",
      });
    }

    const deals = await ctx.db
      .select({
        id: deal.id,
        name: deal.name,
        status: deal.status,
      })
      .from(deal)
      .orderBy(desc(deal.createdAt));

    // Return deals array directly for easier consumption
    return deals;
  }),

  /**
   * Review a single document - update its status
   */
  reviewDocument: baseProcedure
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
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

      // Log the audit event
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

      return {
        success: true,
        message: `Document status updated to ${input.status}`,
      };
    }),

  /**
   * Bulk review documents - approve/reject multiple at once
   */
  bulkReviewDocuments: baseProcedure
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
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

  /**
   * Get document download URL (proxied through server for Nextcloud files)
   */
  getDocumentDownloadUrl: baseProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const [doc] = await ctx.db
        .select({
          id: onboardingDocument.id,
          filePath: onboardingDocument.filePath,
          fileName: onboardingDocument.fileName,
          fileType: onboardingDocument.fileType,
        })
        .from(onboardingDocument)
        .where(eq(onboardingDocument.id, input.documentId))
        .limit(1);

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Return a URL that goes through our API to proxy the Nextcloud file
      return {
        success: true,
        downloadUrl: `/api/documents/download?id=${doc.id}`,
        fileName: doc.fileName,
        fileType: doc.fileType,
      };
    }),
});

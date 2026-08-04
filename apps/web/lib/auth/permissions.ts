/**
 * Permissions Library
 *
 * Investor approval (global status) + per-deal invitations (TEASER / DATA_ROOM).
 */

import { db } from "@repo/db";
import { investorClearance, vehiclePermission, user, onboarding, deal } from "@repo/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  getDealCapabilities,
  type DealAccessLevel,
  type DealLifecycleStatus,
} from "@repo/db/deal-policy";

export type { DealAccessLevel } from "@repo/db/deal-policy";

export type ClearanceStatus =
  | "pending_review"
  | "approved"
  | "needs_information"
  | "rejected";

export type UserClearance = {
  status: ClearanceStatus;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
  clearedBy: string | null;
  investorVisibleNotes: string | null;
};

export type UserAccessInfo = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnboardingCompleted: boolean;
  clearance: UserClearance | null;
  hasFullAccess: boolean;
  canViewDealDocuments: boolean;
  canAccessDealMarketplace: boolean;
};

export type DealInvitation = {
  accessLevel: DealAccessLevel;
  notes: string | null;
};

/** True when investor is globally approved to receive invitations / see deals. */
export function isApprovedStatus(
  status: string | null | undefined
): status is "approved" {
  return status === "approved";
}

/**
 * Get the current clearance status for a user
 * Returns the most recent clearance record
 */
export async function getUserClearance(
  userId: string
): Promise<UserClearance | null> {
  const [clearanceRecord] = await db
    .select({
      status: investorClearance.status,
      conditions: investorClearance.conditions,
      conditionsJson: investorClearance.conditionsJson,
      clearedAt: investorClearance.clearedAt,
      clearedBy: investorClearance.clearedBy,
      investorVisibleNotes: investorClearance.investorVisibleNotes,
    })
    .from(investorClearance)
    .where(eq(investorClearance.userId, userId))
    .orderBy(desc(investorClearance.createdAt))
    .limit(1);

  if (!clearanceRecord) {
    return null;
  }

  return {
    status: clearanceRecord.status as ClearanceStatus,
    conditions: clearanceRecord.conditions,
    conditionsJson: clearanceRecord.conditionsJson as string[] | null,
    clearedAt: clearanceRecord.clearedAt,
    clearedBy: clearanceRecord.clearedBy,
    investorVisibleNotes: clearanceRecord.investorVisibleNotes,
  };
}

/**
 * Get active deal invitation for a user on a specific deal
 */
export async function getDealInvitation(
  userId: string,
  dealId: string
): Promise<DealInvitation | null> {
  const [row] = await db
    .select({
      accessLevel: vehiclePermission.accessLevel,
      notes: vehiclePermission.notes,
    })
    .from(vehiclePermission)
    .where(
      and(
        eq(vehiclePermission.userId, userId),
        eq(vehiclePermission.dealId, dealId),
        isNull(vehiclePermission.revokedAt)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    accessLevel: row.accessLevel as DealAccessLevel,
    notes: row.notes,
  };
}

/**
 * Check if a user has an active invitation to a deal
 */
export async function hasDealInvitation(
  userId: string,
  dealId: string
): Promise<boolean> {
  const clearance = await getUserClearance(userId);
  if (!clearance || !isApprovedStatus(clearance.status)) {
    return false;
  }

  const invitation = await getDealInvitation(userId, dealId);
  return invitation !== null;
}

/**
 * Derive capability flags from invitation access level + deal lifecycle.
 * Single source of truth: {@link getDealCapabilities} in @repo/db/deal-policy.
 */
export function capabilitiesFromAccessLevel(
  accessLevel: DealAccessLevel | null,
  opts?: { isAdmin?: boolean; dealStatus?: DealLifecycleStatus }
): {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  accessLevel: DealAccessLevel | null;
} {
  const { canViewTeaser, canViewDocuments, canExpressInterest, canInvest, accessLevel: level } =
    getDealCapabilities({
      isAdmin: opts?.isAdmin ?? false,
      accessLevel,
      dealStatus: opts?.dealStatus ?? "live",
    });
  return { canViewTeaser, canViewDocuments, canExpressInterest, canInvest, accessLevel: level };
}

/**
 * Get complete access information for a user
 */
export async function getUserAccessInfo(
  userId: string | null | undefined
): Promise<UserAccessInfo> {
  if (!userId) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isOnboardingCompleted: false,
      clearance: null,
      hasFullAccess: false,
      canViewDealDocuments: false,
      canAccessDealMarketplace: false,
    };
  }

  const [userRecord] = await db
    .select({
      id: user.id,
      role: user.role,
      isOnboardingCompleted: user.isOnboardingCompleted,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRecord) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isOnboardingCompleted: false,
      clearance: null,
      hasFullAccess: false,
      canViewDealDocuments: false,
      canAccessDealMarketplace: false,
    };
  }

  const isAdmin = userRecord.role === "admin";
  const isOnboardingCompleted = userRecord.isOnboardingCompleted ?? false;

  if (isAdmin) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      isOnboardingCompleted,
      clearance: {
        status: "approved",
        conditions: null,
        conditionsJson: null,
        clearedAt: null,
        clearedBy: null,
        investorVisibleNotes: null,
      },
      hasFullAccess: true,
      canViewDealDocuments: true,
      canAccessDealMarketplace: true,
    };
  }

  const clearance = await getUserClearance(userId);
  const isApproved = isApprovedStatus(clearance?.status);

  return {
    isAuthenticated: true,
    isAdmin: false,
    isOnboardingCompleted,
    clearance,
    hasFullAccess: isApproved,
    canViewDealDocuments: isApproved,
    canAccessDealMarketplace: isOnboardingCompleted,
  };
}

export async function needsOnboarding(userId: string): Promise<boolean> {
  const [userRecord] = await db
    .select({
      isOnboardingCompleted: user.isOnboardingCompleted,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return !userRecord?.isOnboardingCompleted;
}

export async function getOnboardingStatus(userId: string): Promise<{
  isCompleted: boolean;
  status: string | null;
  submittedAt: Date | null;
}> {
  const [onboardingRecord] = await db
    .select({
      status: onboarding.status,
      submittedAt: onboarding.submittedAt,
    })
    .from(onboarding)
    .where(eq(onboarding.userId, userId))
    .orderBy(desc(onboarding.createdAt))
    .limit(1);

  const [userRecord] = await db
    .select({
      isOnboardingCompleted: user.isOnboardingCompleted,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    isCompleted: userRecord?.isOnboardingCompleted ?? false,
    status: onboardingRecord?.status ?? null,
    submittedAt: onboardingRecord?.submittedAt ?? null,
  };
}

/**
 * Get all deal IDs that a user has been invited to
 */
export async function getVisibleDealIds(userId: string): Promise<string[]> {
  const clearance = await getUserClearance(userId);

  if (!clearance || !isApprovedStatus(clearance.status)) {
    return [];
  }

  const invitations = await db
    .select({ dealId: vehiclePermission.dealId })
    .from(vehiclePermission)
    .where(
      and(
        eq(vehiclePermission.userId, userId),
        isNull(vehiclePermission.revokedAt)
      )
    );

  return invitations.map((p) => p.dealId);
}

export async function canViewDeal(
  userId: string,
  dealId: string
): Promise<boolean> {
  return hasDealInvitation(userId, dealId);
}

/**
 * Get deal capabilities derived from invitation access level
 */
export async function getDealPermissions(
  userId: string,
  dealId: string
): Promise<{
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  accessLevel: DealAccessLevel | null;
  clearanceStatus: ClearanceStatus | null;
  hasPermission: boolean;
} | null> {
  const clearance = await getUserClearance(userId);

  if (!clearance || !isApprovedStatus(clearance.status)) {
    return {
      canViewTeaser: false,
      canViewDocuments: false,
      canExpressInterest: false,
      canInvest: false,
      accessLevel: null,
      clearanceStatus: clearance?.status ?? null,
      hasPermission: false,
    };
  }

  const invitation = await getDealInvitation(userId, dealId);
  if (!invitation) {
    return {
      canViewTeaser: false,
      canViewDocuments: false,
      canExpressInterest: false,
      canInvest: false,
      accessLevel: null,
      clearanceStatus: clearance.status,
      hasPermission: false,
    };
  }

  const [dealRow] = await db
    .select({ status: deal.status })
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  const caps = capabilitiesFromAccessLevel(invitation.accessLevel, {
    dealStatus: (dealRow?.status as DealLifecycleStatus) ?? "live",
  });
  return {
    ...caps,
    clearanceStatus: clearance.status,
    hasPermission: true,
  };
}

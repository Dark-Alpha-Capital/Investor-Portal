/**
 * Permissions Library
 *
 * Investor approval (global status) + per-deal invitations (TEASER / DATA_ROOM).
 */

import { db } from "@repo/db";
import { investorClearance, vehiclePermission, user, onboarding } from "@repo/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export type ClearanceStatus =
  | "pending_review"
  | "approved"
  | "needs_information"
  | "rejected";

export type DealAccessLevel = "teaser" | "data_room";

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

/** @deprecated Use hasDealInvitation */
export async function hasVehicleAccess(
  userId: string,
  dealId: string
): Promise<boolean> {
  return hasDealInvitation(userId, dealId);
}

/**
 * Derive capability flags from invitation access level
 */
export function capabilitiesFromAccessLevel(
  accessLevel: DealAccessLevel | null,
  opts?: { isAdmin?: boolean }
): {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  accessLevel: DealAccessLevel | null;
} {
  if (opts?.isAdmin) {
    return {
      canViewTeaser: true,
      canViewDocuments: true,
      canExpressInterest: true,
      canInvest: true,
      accessLevel: "data_room",
    };
  }

  if (!accessLevel) {
    return {
      canViewTeaser: false,
      canViewDocuments: false,
      canExpressInterest: false,
      canInvest: false,
      accessLevel: null,
    };
  }

  const isDataRoom = accessLevel === "data_room";
  return {
    canViewTeaser: true,
    canViewDocuments: isDataRoom,
    canExpressInterest: isDataRoom,
    canInvest: isDataRoom,
    accessLevel,
  };
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

export type PermissionCheckResult = {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
};

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

  const caps = capabilitiesFromAccessLevel(invitation.accessLevel);
  return {
    ...caps,
    clearanceStatus: clearance.status,
    hasPermission: true,
  };
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const [userRecord] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return userRecord?.role === "admin";
}

export async function canAccessRoute(
  userId: string | null | undefined,
  pathname: string
): Promise<PermissionCheckResult> {
  const accessInfo = await getUserAccessInfo(userId);

  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return { allowed: true };
  }

  if (!accessInfo.isAuthenticated) {
    return {
      allowed: false,
      reason: "Authentication required",
      redirectTo: "/login",
    };
  }

  if (pathname.startsWith("/admin")) {
    if (!accessInfo.isAdmin) {
      return {
        allowed: false,
        reason: "Admin access required",
        redirectTo: "/dashboard",
      };
    }
    return { allowed: true };
  }

  if (pathname.startsWith("/onboarding")) {
    return { allowed: true };
  }

  if (!accessInfo.isOnboardingCompleted) {
    if (pathname === "/dashboard" || pathname === "/profile") {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Please complete onboarding first",
      redirectTo: "/onboarding",
    };
  }

  if (pathname.startsWith("/deals/") && pathname.includes("/documents")) {
    if (!accessInfo.canViewDealDocuments) {
      return {
        allowed: false,
        reason: "Approval required to view deal documents",
        redirectTo: "/dashboard?restricted=documents",
      };
    }
    return { allowed: true };
  }

  if (pathname.startsWith("/deals")) {
    if (!accessInfo.canAccessDealMarketplace) {
      return {
        allowed: false,
        reason: "Complete onboarding to access deal marketplace",
        redirectTo: "/onboarding",
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

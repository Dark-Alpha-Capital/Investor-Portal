/**
 * Permissions Library
 *
 * Provides utilities for checking user permissions, clearance status,
 * and access control throughout the investor portal.
 */

import { db } from "@repo/db";
import { investorClearance, vehiclePermission, user, onboarding } from "@repo/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

// Clearance status types matching the database enum
export type ClearanceStatus =
  | "pending"
  | "cleared"
  | "cleared_with_conditions"
  | "rejected";

// User clearance information
export type UserClearance = {
  status: ClearanceStatus;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
  clearedBy: string | null;
};

// User access information
export type UserAccessInfo = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnboardingCompleted: boolean;
  clearance: UserClearance | null;
  hasFullAccess: boolean;
  canViewDealDocuments: boolean;
  canAccessDealMarketplace: boolean;
};

/**
 * Get the current clearance status for a user
 * Returns the most recent active clearance record
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
  };
}

// Vehicle permission details
export type VehicleAccessLevel = {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
};

/**
 * Check if a user has access to a specific deal/vehicle
 */
export async function hasVehicleAccess(
  userId: string,
  dealId: string
): Promise<boolean> {
  // First check clearance status
  const clearance = await getUserClearance(userId);

  // If not cleared, no access
  if (!clearance || clearance.status === "pending" || clearance.status === "rejected") {
    return false;
  }

  // Check vehicle-specific permission
  const [permission] = await db
    .select({
      id: vehiclePermission.id,
      canViewDocuments: vehiclePermission.canViewDocuments,
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

  return !!permission;
}

/**
 * Get detailed vehicle access for a user on a specific deal
 */
export async function getVehicleAccessLevel(
  userId: string,
  dealId: string
): Promise<VehicleAccessLevel | null> {
  const [permission] = await db
    .select({
      canViewTeaser: vehiclePermission.canViewTeaser,
      canViewDocuments: vehiclePermission.canViewDocuments,
      canExpressInterest: vehiclePermission.canExpressInterest,
      canInvest: vehiclePermission.canInvest,
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

  return permission || null;
}

/**
 * Get complete access information for a user
 * This is the main function to determine what a user can see/do
 */
export async function getUserAccessInfo(
  userId: string | null | undefined
): Promise<UserAccessInfo> {
  // Not authenticated
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

  // Get user record
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

  // Admins have full access regardless of clearance
  if (isAdmin) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      isOnboardingCompleted,
      clearance: {
        status: "cleared",
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

  // Get clearance status for regular users
  const clearance = await getUserClearance(userId);

  // Determine access levels based on clearance
  const isCleared =
    clearance?.status === "cleared" ||
    clearance?.status === "cleared_with_conditions";

  return {
    isAuthenticated: true,
    isAdmin: false,
    isOnboardingCompleted,
    clearance,
    hasFullAccess: clearance?.status === "cleared",
    canViewDealDocuments: isCleared,
    canAccessDealMarketplace: isOnboardingCompleted, // Can browse marketplace but not download docs until cleared
  };
}

/**
 * Check if user needs to complete onboarding
 */
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

/**
 * Get onboarding status for a user
 */
export async function getOnboardingStatus(
  userId: string
): Promise<{
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
 * Permission check result
 */
export type PermissionCheckResult = {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
};

/**
 * Check if user can access a specific route
 */
export async function canAccessRoute(
  userId: string | null | undefined,
  pathname: string
): Promise<PermissionCheckResult> {
  const accessInfo = await getUserAccessInfo(userId);

  // Public routes - no check needed
  const publicRoutes = ["/", "/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return { allowed: true };
  }

  // Auth required from here
  if (!accessInfo.isAuthenticated) {
    return {
      allowed: false,
      reason: "Authentication required",
      redirectTo: "/login",
    };
  }

  // Admin routes - admin only
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

  // Onboarding route - always accessible for authenticated users
  if (pathname.startsWith("/onboarding")) {
    return { allowed: true };
  }

  // Check if user needs to complete onboarding
  if (!accessInfo.isOnboardingCompleted) {
    // Allow profile and dashboard access
    if (pathname === "/dashboard" || pathname === "/profile") {
      return { allowed: true };
    }

    // Redirect other routes to onboarding
    return {
      allowed: false,
      reason: "Please complete onboarding first",
      redirectTo: "/onboarding",
    };
  }

  // Deal documents - require clearance
  if (
    pathname.startsWith("/deals/") &&
    pathname.includes("/documents")
  ) {
    if (!accessInfo.canViewDealDocuments) {
      return {
        allowed: false,
        reason: "Clearance required to view deal documents",
        redirectTo: "/dashboard?restricted=documents",
      };
    }
    return { allowed: true };
  }

  // Deal marketplace - accessible after onboarding
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

  // Default: allow access for authenticated users
  return { allowed: true };
}

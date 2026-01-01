import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getUserWithKycStatus } from "@repo/db/queries";

/**
 * Cached function to fetch user dashboard data.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * The userId becomes part of the cache key, so each user
 * has their own cache entry.
 */
export async function getDashboardUserCached(userId: string) {
  "use cache";
  cacheLife("minutes"); // Cache for a few minutes - user data can change
  cacheTag(`dashboard-user-${userId}`);

  const userData = await getUserWithKycStatus(userId);

  if (!userData) {
    return null;
  }

  return {
    userId,
    isOnboardingCompleted: userData.isOnboardingCompleted,
    kycStatus: userData.kycStatus,
  };
}

export type DashboardUserData = NonNullable<
  Awaited<ReturnType<typeof getDashboardUserCached>>
>;

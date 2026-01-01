import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cached function to fetch user's onboarding status.
 * Returns whether user has completed onboarding.
 *
 * Cache is per-user because data is user-specific.
 */
export async function getOnboardingStatusCached(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`onboarding-status-${userId}`);

  const [userData] = await db
    .select({
      isOnboardingCompleted: user.isOnboardingCompleted,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    isOnboarded: userData?.isOnboardingCompleted ?? false,
  };
}

export type OnboardingStatusData = Awaited<
  ReturnType<typeof getOnboardingStatusCached>
>;

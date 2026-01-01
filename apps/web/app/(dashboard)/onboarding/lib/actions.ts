"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the onboarding status cache.
 * Call this after user completes onboarding.
 */
export async function revalidateOnboardingStatusCache(userId: string) {
  revalidateTag(`onboarding-status-${userId}`, "max");
}

"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the user dashboard cache.
 * Call this after mutations that affect user's KYC status or onboarding.
 */
export async function revalidateDashboardCache(userId: string) {
  revalidateTag(`dashboard-user-${userId}`, "max");
}

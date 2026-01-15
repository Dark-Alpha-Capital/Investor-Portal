"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the investor compliance cache.
 * Call this after mutations that affect investor compliance data.
 *
 * @param investorId - The ID of the investor whose compliance cache should be revalidated
 */
export async function revalidateInvestorComplianceCache(investorId: string) {
  revalidateTag(`investor-compliance-${investorId}`, "max");
}

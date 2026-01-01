"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the marketplace deals cache for a specific user.
 * Call this after mutations to refresh cached data.
 */
export async function revalidateMarketplaceDealsCache(userId: string) {
  revalidateTag(`marketplace-deals-${userId}`, "max");
}

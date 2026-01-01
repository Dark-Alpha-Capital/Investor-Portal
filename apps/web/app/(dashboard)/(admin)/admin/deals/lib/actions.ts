"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the admin deals cache.
 * Call this after mutations (create, update, delete) to refresh cached data.
 *
 * Using 'max' scope for immediate cache invalidation.
 */
export async function revalidateDealsCache() {
  revalidateTag("admin-deals", "max");
}

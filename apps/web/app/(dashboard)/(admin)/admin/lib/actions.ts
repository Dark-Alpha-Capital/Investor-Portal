"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the admin investors cache.
 * Call this after mutations (create, update, delete) to refresh cached data.
 */
export async function revalidateInvestorsCache() {
  revalidateTag("admin-investors", "max");
}

/**
 * Server action to revalidate the admin admins cache.
 * Call this after mutations (create, update, delete) to refresh cached data.
 */
export async function revalidateAdminsCache() {
  revalidateTag("admin-admins", "max");
}

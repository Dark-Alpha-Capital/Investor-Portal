import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cached function to fetch deal by ID.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * Arguments become part of the cache key.
 */
export async function getDealByIdCached(dealId: string) {
  "use cache";
  cacheLife("minutes"); // Cache for a few minutes - appropriate for admin data
  cacheTag(`deal-${dealId}`); // Tag for on-demand revalidation
  cacheTag("admin-deals"); // General tag for all deals

  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRecord) {
    return {
      success: false as const,
      deal: null,
    };
  }

  // Transform numeric fields to strings and dates to ISO strings
  return {
    success: true as const,
    deal: {
      ...dealRecord,
      targetRaise: dealRecord.targetRaise?.toString() ?? null,
      minInvestment: dealRecord.minInvestment?.toString() ?? null,
      targetIrr: dealRecord.targetIrr?.toString() ?? null,
      targetMoic: dealRecord.targetMoic?.toString() ?? null,
      launchDate: dealRecord.launchDate?.toISOString() ?? null,
      closeDate: dealRecord.closeDate?.toISOString() ?? null,
      createdAt: dealRecord.createdAt.toISOString(),
      updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
    },
  };
}

export type DealData = Awaited<ReturnType<typeof getDealByIdCached>>;


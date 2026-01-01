import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  getInvestmentTypeBySlug,
  getRelatedInvestmentTypes,
} from "@/lib/constants/investment-types";

/**
 * Cached function to fetch investment type data for programmatic SEO pages.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * Since investment types are static data, we cache for a long time.
 * In the future, this could fetch dynamic data like deal counts per type.
 */
export async function getInvestmentTypeDataCached(typeSlug: string) {
  "use cache";
  cacheLife("days"); // Cache for days since investment type data is mostly static
  cacheTag(`investment-type-${typeSlug}`);

  const investmentType = getInvestmentTypeBySlug(typeSlug);

  if (!investmentType) {
    return null;
  }

  const relatedTypes = getRelatedInvestmentTypes(typeSlug);

  // In the future, you could fetch dynamic data here:
  // - Count of active deals of this type
  // - Historical returns
  // - Performance metrics

  return {
    investmentType,
    relatedTypes,
    // Add dynamic data here in the future
    stats: {
      // Placeholder stats - replace with real data
      activeDealCount: 0,
      totalAUM: "$0",
      historicalReturn: "N/A",
    },
  };
}

export type InvestmentTypeData = NonNullable<
  Awaited<ReturnType<typeof getInvestmentTypeDataCached>>
>;

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSectorBySlug, getRelatedSectors } from "@/lib/constants/sectors";

/**
 * Cached function to fetch sector data for programmatic SEO pages.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * Since sectors are static data, we cache for a long time.
 * In the future, this could fetch dynamic data like deal counts per sector.
 */
export async function getSectorDataCached(sectorSlug: string) {
  "use cache";
  cacheLife("days"); // Cache for days since sector data is mostly static
  cacheTag(`sector-${sectorSlug}`);

  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    return null;
  }

  const relatedSectors = getRelatedSectors(sectorSlug);

  // In the future, you could fetch dynamic data here:
  // - Count of active deals in this sector
  // - Recent investments in this sector
  // - Performance metrics
  // const dealCount = await db.select({ count: sql`count(*)` })
  //   .from(deal)
  //   .where(eq(deal.sector, sector.name));

  return {
    sector,
    relatedSectors,
    // Add dynamic data here in the future
    stats: {
      // Placeholder stats - replace with real data
      activeDealCount: 0,
      totalInvested: "$0",
      avgReturn: "N/A",
    },
  };
}

export type SectorData = NonNullable<Awaited<ReturnType<typeof getSectorDataCached>>>;

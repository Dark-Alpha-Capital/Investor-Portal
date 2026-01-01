import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { desc, and, ilike, eq, or, sql } from "drizzle-orm";

type GetDealsParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  visibility?: string;
};

/**
 * Cached function to fetch deals for admin dashboard.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * Arguments become part of the cache key, so different filter
 * combinations will have separate cache entries.
 */
export async function getDealsCached({
  page,
  limit,
  search,
  status,
  visibility,
}: GetDealsParams) {
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [];

  // Add search filter
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(deal.name, searchTerm),
        ilike(deal.description, searchTerm),
        ilike(deal.sector, searchTerm)
      )!
    );
  }

  // Add status filter
  if (status && status !== "all") {
    conditions.push(
      eq(
        deal.status,
        status as
          | "draft"
          | "coming_soon"
          | "live"
          | "closing"
          | "funded"
          | "exited"
          | "cancelled"
      )
    );
  }

  // Add visibility filter
  if (visibility && visibility !== "all") {
    conditions.push(
      eq(deal.visibility, visibility as "public" | "accredited" | "invite_only")
    );
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deal)
    .where(whereCondition);

  const totalCount = countResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated deals
  const deals = await db
    .select()
    .from(deal)
    .where(whereCondition)
    .orderBy(desc(deal.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    deals: deals.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt?.toISOString() ?? null,
      launchDate: d.launchDate?.toISOString() ?? null,
      closeDate: d.closeDate?.toISOString() ?? null,
      targetRaise: d.targetRaise?.toString() ?? null,
      minInvestment: d.minInvestment?.toString() ?? null,
      targetIrr: d.targetIrr?.toString() ?? null,
      targetMoic: d.targetMoic?.toString() ?? null,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export type DealsData = Awaited<ReturnType<typeof getDealsCached>>;

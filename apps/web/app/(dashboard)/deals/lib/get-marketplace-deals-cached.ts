import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal, dealInvite, user } from "@repo/db/schema";
import { desc, and, or, ne, ilike, eq, sql, inArray } from "drizzle-orm";

type GetMarketplaceDealsParams = {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sector?: string;
};

/**
 * Cached function to fetch marketplace deals for a specific user.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 *
 * Cache is per-user because visibility depends on user's KYC status and invites.
 * Arguments (including userId) become part of the cache key.
 */
export async function getMarketplaceDealsCached({
  userId,
  page,
  limit,
  search,
  status,
  sector,
}: GetMarketplaceDealsParams) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace-deals-${userId}`);

  const offset = (page - 1) * limit;

  // Get user's KYC status
  const [userRecord] = await db
    .select({ kycStatus: user.kycStatus })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const isAccredited = userRecord?.kycStatus === "approved";

  // Get user's invited deal IDs
  const invitedDeals = await db
    .select({
      dealId: dealInvite.dealId,
      curationNote: dealInvite.curationNote,
    })
    .from(dealInvite)
    .where(eq(dealInvite.userId, userId));

  const invitedDealIds = invitedDeals.map((d) => d.dealId);
  const invitedDealNotes = new Map(
    invitedDeals.map((d) => [d.dealId, d.curationNote])
  );

  // Build base conditions
  const baseConditions = [ne(deal.status, "draft")];

  // Add search filter
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    baseConditions.push(
      or(
        ilike(deal.name, searchTerm),
        ilike(deal.teaserSummary, searchTerm),
        ilike(deal.description, searchTerm),
        ilike(deal.sector, searchTerm),
        ilike(deal.geography, searchTerm)
      )!
    );
  }

  // Add status filter
  if (status && status !== "all") {
    baseConditions.push(
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

  // Add sector filter
  if (sector && sector !== "all") {
    baseConditions.push(ilike(deal.sector, sector));
  }

  // Build visibility conditions
  // User can see: public deals, accredited deals (if approved), and deals they're invited to
  const visibilityConditions = [eq(deal.visibility, "public")];

  if (isAccredited) {
    visibilityConditions.push(eq(deal.visibility, "accredited"));
  }

  if (invitedDealIds.length > 0) {
    visibilityConditions.push(inArray(deal.id, invitedDealIds));
  }

  // Combine all conditions
  const whereCondition = and(...baseConditions, or(...visibilityConditions));

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

  // Get unique sectors for filter dropdown
  const sectorsResult = await db
    .selectDistinct({ sector: deal.sector })
    .from(deal)
    .where(and(ne(deal.status, "draft"), or(...visibilityConditions)));

  const sectors = sectorsResult
    .map((s) => s.sector)
    .filter((s): s is string => s !== null)
    .sort();

  return {
    success: true,
    deals: deals.map((dealRecord) => ({
      ...dealRecord,
      createdAt: dealRecord.createdAt.toISOString(),
      updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
      launchDate: dealRecord.launchDate?.toISOString() ?? null,
      closeDate: dealRecord.closeDate?.toISOString() ?? null,
      targetRaise: dealRecord.targetRaise?.toString() ?? null,
      minInvestment: dealRecord.minInvestment?.toString() ?? null,
      targetIrr: dealRecord.targetIrr?.toString() ?? null,
      targetMoic: dealRecord.targetMoic?.toString() ?? null,
      isCurated: invitedDealIds.includes(dealRecord.id),
      curationNote: invitedDealNotes.get(dealRecord.id) ?? null,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      sectors,
    },
  };
}

export type MarketplaceDealsData = Awaited<
  ReturnType<typeof getMarketplaceDealsCached>
>;

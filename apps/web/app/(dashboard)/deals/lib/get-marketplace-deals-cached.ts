import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import {
  deal,
  vehiclePermission,
  user,
  investorClearance,
} from "@repo/db/schema";
import {
  desc,
  and,
  or,
  ne,
  ilike,
  eq,
  sql,
  inArray,
  isNull,
} from "drizzle-orm";

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
 * Cache is per-user because visibility depends on:
 * 1. User's clearance status (must be cleared or cleared_with_conditions)
 * 2. User's vehiclePermission records (determines which deals are visible)
 *
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
  const offset = (page - 1) * limit;

  // Check user's role (admins see all deals)
  const [userRecord] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const isAdmin = userRecord?.role === "admin";

  // Check user's clearance status
  const [clearanceRecord] = await db
    .select({ status: investorClearance.status })
    .from(investorClearance)
    .where(eq(investorClearance.userId, userId))
    .orderBy(desc(investorClearance.createdAt))
    .limit(1);

  const clearanceStatus = clearanceRecord?.status ?? null;
  const isCleared =
    clearanceStatus === "cleared" ||
    clearanceStatus === "cleared_with_conditions";

  // Get user's permitted deal IDs (where canViewTeaser = true and not revoked)
  // Only fetch if user is cleared (or admin)
  let permittedDealIds: string[] = [];
  let permissionNotes = new Map<string, string | null>();

  if (isCleared || isAdmin) {
    const permissions = await db
      .select({
        dealId: vehiclePermission.dealId,
        notes: vehiclePermission.notes,
      })
      .from(vehiclePermission)
      .where(
        and(
          eq(vehiclePermission.userId, userId),
          eq(vehiclePermission.canViewTeaser, true),
          isNull(vehiclePermission.revokedAt)
        )
      );

    permittedDealIds = permissions.map((p) => p.dealId);
    permissionNotes = new Map(permissions.map((p) => [p.dealId, p.notes]));
  }

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

  // Build visibility condition based on vehiclePermission
  // Admin sees all non-draft deals, cleared investors see only permitted deals
  let whereCondition;

  if (isAdmin) {
    // Admins see all non-draft deals
    whereCondition = and(...baseConditions);
  } else if (isCleared && permittedDealIds.length > 0) {
    // Cleared investors see only deals they have permission for
    whereCondition = and(...baseConditions, inArray(deal.id, permittedDealIds));
  } else {
    // Not cleared or no permissions = no deals
    // Return empty result
    return {
      success: true,
      deals: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        sectors: [],
      },
      clearanceStatus,
    };
  }

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

  // Get unique sectors for filter dropdown (from permitted deals only)
  let sectorsResult: { sector: string | null }[] = [];
  if (isAdmin) {
    sectorsResult = await db
      .selectDistinct({ sector: deal.sector })
      .from(deal)
      .where(ne(deal.status, "draft"));
  } else if (permittedDealIds.length > 0) {
    sectorsResult = await db
      .selectDistinct({ sector: deal.sector })
      .from(deal)
      .where(and(ne(deal.status, "draft"), inArray(deal.id, permittedDealIds)));
  }

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
      // Deal is "curated" if user has a permission note for it
      isCurated:
        permissionNotes.has(dealRecord.id) &&
        !!permissionNotes.get(dealRecord.id),
      curationNote: permissionNotes.get(dealRecord.id) ?? null,
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
    clearanceStatus,
  };
}

export type MarketplaceDealsData = Awaited<
  ReturnType<typeof getMarketplaceDealsCached>
>;

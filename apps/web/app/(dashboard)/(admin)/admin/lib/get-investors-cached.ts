import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { desc, and, or, ne, isNull, ilike, eq, sql } from "drizzle-orm";

type GetInvestorsParams = {
  page: number;
  limit: number;
  search?: string;
  kycStatus?: string;
  verified?: string;
};

/**
 * Cached function to fetch investors for admin dashboard.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getInvestorsCached({
  page,
  limit,
  search,
  kycStatus,
  verified,
}: GetInvestorsParams) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-investors");

  const offset = (page - 1) * limit;

  // Build conditions - non-admin users only
  const conditions = [or(ne(user.role, "admin"), isNull(user.role))];

  // Add search filter
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!
    );
  }

  // Add KYC status filter
  if (kycStatus && kycStatus !== "all") {
    conditions.push(
      eq(
        user.kycStatus,
        kycStatus as "review" | "approved" | "pending_docs" | "rejected"
      )
    );
  }

  // Add verified filter
  if (verified && verified !== "all") {
    if (verified === "verified") {
      conditions.push(eq(user.emailVerified, true));
    } else if (verified === "unverified") {
      conditions.push(eq(user.emailVerified, false));
    }
  }

  const whereCondition = and(...conditions);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(whereCondition);

  const totalCount = countResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated investors
  const investors = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
      kycStatus: user.kycStatus,
    })
    .from(user)
    .where(whereCondition)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    investors: investors.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt?.toISOString() ?? null,
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

export type InvestorsData = Awaited<ReturnType<typeof getInvestorsCached>>;

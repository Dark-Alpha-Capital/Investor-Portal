import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { desc, and, or, isNull, ilike, eq, sql } from "drizzle-orm";

type GetAdminsParams = {
  page: number;
  limit: number;
  search?: string;
  verified?: string;
  status?: string;
};

/**
 * Cached function to fetch admins for admin dashboard.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getAdminsCached({
  page,
  limit,
  search,
  verified,
  status,
}: GetAdminsParams) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-admins");

  const offset = (page - 1) * limit;

  // Build conditions - admins only
  const conditions = [eq(user.role, "admin")];

  // Add search filter
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!
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

  // Add status filter (banned/active)
  if (status && status !== "all") {
    if (status === "banned") {
      conditions.push(eq(user.banned, true));
    } else if (status === "active") {
      conditions.push(or(eq(user.banned, false), isNull(user.banned))!);
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

  // Get paginated admins
  const admins = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(whereCondition)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    admins: admins.map((admin) => ({
      ...admin,
      createdAt: admin.createdAt?.toISOString() ?? null,
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

export type AdminsData = Awaited<ReturnType<typeof getAdminsCached>>;

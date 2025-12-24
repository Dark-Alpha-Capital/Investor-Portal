import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import { user, deal } from "@repo/db/schema";
import { desc, eq, or, ne, isNull, and, ilike, sql } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  /**
   * Get paginated investors (non-admin users) with filtering
   */
  getInvestors: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        kycStatus: z.string().optional(),
        verified: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, kycStatus, verified } = input;
      const offset = (page - 1) * limit;

      // Build conditions
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
        conditions.push(eq(user.kycStatus, kycStatus as "review" | "approved" | "pending_docs" | "rejected"));
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
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated investors
      const investors = await ctx.db
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
    }),

  /**
   * Get paginated admins with filtering
   */
  getAdmins: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        verified: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, verified, status } = input;
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
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated admins
      const admins = await ctx.db
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
    }),

  /**
   * Get paginated deals for admin with filtering
   */
  getDeals: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        status: z.string().optional(),
        visibility: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, visibility } = input;
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
        conditions.push(eq(deal.status, status as "draft" | "coming_soon" | "live" | "closing" | "funded" | "exited" | "cancelled"));
      }

      // Add visibility filter
      if (visibility && visibility !== "all") {
        conditions.push(eq(deal.visibility, visibility as "public" | "accredited" | "invite_only"));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(deal)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated deals
      const deals = await ctx.db
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
    }),
});

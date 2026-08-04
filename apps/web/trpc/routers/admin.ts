import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import {
  user,
  deal,
} from "@repo/db/schema";
import { desc, eq, or, isNull, and, sql } from "drizzle-orm";
import { tokenizedSearchCondition } from "@repo/db/deal-search";

export const adminRouter = createTRPCRouter({
  /**
   * Get paginated investors (non-admin users) with filtering
   */

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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status } = input;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions: ReturnType<typeof eq>[] = [];

      // Add search filter (word-based: each token matches at least one field)
      if (search && search.trim()) {
        const searchCondition = tokenizedSearchCondition(search, [
          deal.name,
          deal.description,
          deal.sector,
        ]);
        if (searchCondition) conditions.push(searchCondition);
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

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
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

  /**
   * Get admin dashboard data (administrators only).
   * Investor KYC / clearance lives under Compliance.
   */
  getAdminDashboard: adminProcedure
    .input(
      z.object({
        adminsPage: z.number().min(1).default(1),
        adminsLimit: z.number().min(1).max(50).default(12),
        adminsSearch: z.string().optional(),
        adminsVerified: z.string().optional(),
        adminsStatus: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        adminsPage,
        adminsLimit,
        adminsSearch,
        adminsVerified,
        adminsStatus,
      } = input;

      const offset = (adminsPage - 1) * adminsLimit;
      const conditions = [eq(user.role, "admin")];

      if (adminsSearch && adminsSearch.trim()) {
        const searchTerm = `%${adminsSearch.trim().toLowerCase()}%`;
        conditions.push(
          or(
            sql`lower(${user.name}) like ${searchTerm}`,
            sql`lower(${user.email}) like ${searchTerm}`
          )!
        );
      }

      if (adminsVerified && adminsVerified !== "all") {
        if (adminsVerified === "verified") {
          conditions.push(eq(user.emailVerified, true));
        } else if (adminsVerified === "unverified") {
          conditions.push(eq(user.emailVerified, false));
        }
      }

      if (adminsStatus && adminsStatus !== "all") {
        if (adminsStatus === "banned") {
          conditions.push(eq(user.banned, true));
        } else if (adminsStatus === "active") {
          conditions.push(or(eq(user.banned, false), isNull(user.banned))!);
        }
      }

      const whereCondition = and(...conditions);

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / adminsLimit);

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
        .limit(adminsLimit)
        .offset(offset);

      return {
        admins: {
          success: true,
          admins: admins.map((admin) => ({
            ...admin,
            createdAt: admin.createdAt?.toISOString() ?? null,
          })),
          pagination: {
            page: adminsPage,
            limit: adminsLimit,
            totalCount,
            totalPages,
            hasNextPage: adminsPage < totalPages,
            hasPrevPage: adminsPage > 1,
          },
        },
      };
    }),

});

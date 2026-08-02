import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import {
  user,
  deal,
  dealInterest,
  investment,
} from "@repo/db/schema";
import { desc, eq, or, ne, isNull, and, ilike, sql } from "drizzle-orm";
import {
  getDealById,
  getDealInvitationsWithUsersByDealId,
  getDealInterestsWithUsersByDealId,
  getDealInvestmentsWithUsersByDealId,
} from "@repo/db/queries";
import slugify from "slugify";
import {
  createNextcloudClientFromEnv,
  fileExists,
  listFiles,
  sanitizeDealFolderSegment,
} from "@repo/nextcloud";

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
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
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
        .select({ count: sql<number>`count(*)` })
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status } = input;
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
        const searchTerm = `%${adminsSearch.trim()}%`;
        conditions.push(
          or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!
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

  /**
   * Get complete deal detail with invites, interests, investments, and files
   */
  getDealDetail: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { dealId } = input;

      // Fetch all data in parallel
      const [dealRecord, invites, interests, investments] = await Promise.all([
        getDealById(dealId),
        getDealInvitationsWithUsersByDealId(dealId),
        getDealInterestsWithUsersByDealId(dealId),
        getDealInvestmentsWithUsersByDealId(dealId),
      ]);

      // Check if deal exists
      if (!dealRecord) {
        return {
          success: false as const,
          deal: null,
          invites: [],
          interests: [],
          investments: [],
          files: [],
        };
      }

      // Transform deal data
      const transformedDeal = {
        ...dealRecord,
        targetRaise: dealRecord.targetRaise?.toString() ?? null,
        minInvestment: dealRecord.minInvestment?.toString() ?? null,
        targetIrr: dealRecord.targetIrr?.toString() ?? null,
        targetMoic: dealRecord.targetMoic?.toString() ?? null,
        launchDate: dealRecord.launchDate?.toISOString() ?? null,
        closeDate: dealRecord.closeDate?.toISOString() ?? null,
        createdAt: dealRecord.createdAt.toISOString(),
        updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
      };

      // Transform invites (compliance vehicle_permission rows)
      const transformedInvites = invites.map((invite) => ({
        ...invite,
        grantedAt: invite.grantedAt.toISOString(),
      }));

      // Transform interests
      const transformedInterests = interests.map((interest) => ({
        ...interest,
        proposedAmount: interest.proposedAmount?.toString() ?? null,
        createdAt: interest.createdAt.toISOString(),
        updatedAt: interest.updatedAt?.toISOString() ?? null,
      }));

      // Transform investments
      const transformedInvestments = investments.map((inv) => ({
        ...inv,
        committedAmount: inv.committedAmount.toString(),
        fundedAmount: inv.fundedAmount?.toString() ?? null,
        currentValue: inv.currentValue?.toString() ?? null,
        distributions: inv.distributions?.toString() ?? null,
        ownershipPercentage: inv.ownershipPercentage?.toString() ?? null,
        committedDate: inv.committedDate.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt?.toISOString() ?? null,
      }));

      // Fetch files from Nextcloud
      let files: Array<{
        name: string;
        size: number;
        lastModified: string;
        mimeType: string;
        downloadUrl: string;
      }> = [];

      try {
        const dealSlug =
          dealRecord.slug ||
          slugify(dealRecord.name, { lower: true, strict: true });
        const sanitizedName = sanitizeDealFolderSegment(dealSlug);
        const folderPath = `/Deals/Deal_${sanitizedName}`;

        const client = createNextcloudClientFromEnv();

        const folderExists = await fileExists(client, folderPath);

        if (folderExists) {
          files = await listFiles(client, folderPath);
        }
      } catch (error) {
        console.error("Error listing files:", error);
        // Return empty array on error
      }

      return {
        success: true as const,
        deal: transformedDeal,
        invites: transformedInvites,
        interests: transformedInterests,
        investments: transformedInvestments,
        files,
      };
    }),
});

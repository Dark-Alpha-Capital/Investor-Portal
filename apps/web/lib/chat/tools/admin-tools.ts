import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { db } from "@repo/db";
import {
  getAllInvestors,
  getInvestorComplianceDetails,
  getPortfolioData,
} from "@repo/db/queries";
import { deal, dealInterest, session, user } from "@repo/db/schema";
import { and, desc, eq, gt, isNull, like, ne, or, sql } from "drizzle-orm";
import { serializeForToolResult } from "@/lib/chat/tools/serialize";

const FORBIDDEN = {
  error: "Forbidden",
  message: "This tool is only available to admins.",
} as const;

function assertAdmin(isAdmin: boolean) {
  if (!isAdmin) {
    return FORBIDDEN;
  }
  return null;
}

export function createAdminChatTools(options: {
  isAdmin: boolean;
}) {
  const { isAdmin } = options;

  const listInvestors = tool({
    description:
      "Admin only. List investors on the portal: total registered count, how many currently have an active login session, and a summary list. Use when an admin asks how many investors are on the site, currently logged in, or wants a roster.",
    inputSchema: z.object({
      includeLoggedInOnly: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true, only return investors with a non-expired session. Default false returns all registered investors (still includes logged-in counts).",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(50)
        .describe("Max investors to include in the list."),
      search: z
        .string()
        .optional()
        .describe("Optional name or email search filter."),
    }),
    execute: async ({ includeLoggedInOnly, limit, search }) => {
      const denied = assertAdmin(isAdmin);
      if (denied) return denied;

      const now = new Date();
      const investorRoleFilter = or(ne(user.role, "admin"), isNull(user.role));

      const [[totalRow], [loggedInCountRow], loggedInRows] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(user)
          .where(investorRoleFilter),
        db
          .select({
            count: sql<number>`count(distinct ${session.userId})`,
          })
          .from(session)
          .innerJoin(user, eq(session.userId, user.id))
          .where(and(gt(session.expiresAt, now), investorRoleFilter)),
        // Distinct investors with an active session (latest expiry wins via max).
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            kycStatus: user.kycStatus,
            isOnboardingCompleted: user.isOnboardingCompleted,
            sessionExpiresAt: sql<Date>`max(${session.expiresAt})`.as(
              "session_expires_at",
            ),
          })
          .from(session)
          .innerJoin(user, eq(session.userId, user.id))
          .where(and(gt(session.expiresAt, now), investorRoleFilter))
          .groupBy(
            user.id,
            user.name,
            user.email,
            user.kycStatus,
            user.isOnboardingCompleted,
          )
          .orderBy(desc(sql`max(${session.expiresAt})`)),
      ]);

      const totalRegistered = Number(totalRow?.count ?? 0);
      const currentlyLoggedInCount = Number(loggedInCountRow?.count ?? 0);
      const uniqueLoggedIn = loggedInRows;

      if (includeLoggedInOnly) {
        const filtered = search?.trim()
          ? uniqueLoggedIn.filter((row) => {
              const term = search.trim().toLowerCase();
              return (
                row.name?.toLowerCase().includes(term) ||
                row.email?.toLowerCase().includes(term)
              );
            })
          : uniqueLoggedIn;

        return serializeForToolResult({
          totalRegisteredInvestors: totalRegistered,
          currentlyLoggedInInvestors: currentlyLoggedInCount,
          investors: filtered.slice(0, limit ?? 50).map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            kycStatus: row.kycStatus,
            isOnboardingCompleted: row.isOnboardingCompleted,
            sessionExpiresAt: row.sessionExpiresAt,
            isCurrentlyLoggedIn: true,
          })),
        });
      }

      let investors = await getAllInvestors();
      if (search?.trim()) {
        const term = search.trim().toLowerCase();
        investors = investors.filter(
          (inv) =>
            inv.name?.toLowerCase().includes(term) ||
            inv.email?.toLowerCase().includes(term),
        );
      }

      const loggedInIds = new Set(uniqueLoggedIn.map((row) => row.id));

      return serializeForToolResult({
        totalRegisteredInvestors: totalRegistered,
        currentlyLoggedInInvestors: currentlyLoggedInCount,
        investors: investors.slice(0, limit ?? 50).map((inv) => ({
          id: inv.id,
          name: inv.name,
          email: inv.email,
          isOnboardingCompleted: inv.isOnboardingCompleted,
          createdAt: inv.createdAt,
          isCurrentlyLoggedIn: loggedInIds.has(inv.id),
        })),
      });
    },
  });

  const getInvestorDetails = tool({
    description:
      "Admin only. Fetch detailed information about a specific investor: profile, onboarding/KYC, global status, deal invitations, marketplace deal interest, and investments. Look up by user id, email, or name.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe(
          "Investor user id, email, or name (partial match ok for name/email).",
        ),
    }),
    execute: async ({ query }) => {
      const denied = assertAdmin(isAdmin);
      if (denied) return denied;

      const trimmed = query.trim();
      const searchTerm = `%${trimmed}%`;

      const matches = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          isOnboardingCompleted: user.isOnboardingCompleted,
          emailVerified: user.emailVerified,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(
          and(
            or(ne(user.role, "admin"), isNull(user.role)),
            or(
              eq(user.id, trimmed),
              like(user.email, searchTerm),
              like(user.name, searchTerm),
            ),
          ),
        )
        .orderBy(desc(user.createdAt))
        .limit(5);

      if (matches.length === 0) {
        return {
          success: false,
          message: `No investor found matching "${trimmed}".`,
          matches: [],
        };
      }

      if (matches.length > 1) {
        const exact =
          matches.find((m) => m.id === trimmed) ||
          matches.find(
            (m) => m.email?.toLowerCase() === trimmed.toLowerCase(),
          );
        if (!exact) {
          return {
            success: false,
            message:
              "Multiple investors matched. Ask the admin to refine by email or user id.",
            matches: matches.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              kycStatus: m.kycStatus,
            })),
          };
        }
        matches.splice(0, matches.length, exact);
      }

      const investorUser = matches[0]!;
      const [details, portfolio, interests] = await Promise.all([
        getInvestorComplianceDetails(investorUser.id),
        getPortfolioData(investorUser.id),
        db
          .select({
            id: dealInterest.id,
            dealId: dealInterest.dealId,
            dealName: deal.name,
            status: dealInterest.status,
            proposedAmount: dealInterest.proposedAmount,
            createdAt: dealInterest.createdAt,
          })
          .from(dealInterest)
          .innerJoin(deal, eq(dealInterest.dealId, deal.id))
          .where(eq(dealInterest.userId, investorUser.id))
          .orderBy(desc(dealInterest.createdAt)),
      ]);

      if (!details.success || !details.investor) {
        return {
          success: false,
          message: `Found investor ${investorUser.email} but could not load compliance details.`,
          profile: investorUser,
        };
      }

      // Keep full onboarding fields for admins; drop edit history + file URLs.
      let onboarding: Record<string, unknown> | null = null;
      if (details.onboarding) {
        const { editHistory: _editHistory, documents, ...rest } =
          details.onboarding;
        onboarding = {
          ...rest,
          documents: (documents ?? []).map((doc) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            status: doc.status,
            uploadedAt: doc.uploadedAt,
          })),
        };
      }

      return serializeForToolResult({
        success: true,
        profile: {
          ...investorUser,
          clearance: details.investor.clearance ?? null,
        },
        onboarding,
        clearanceHistory: details.clearanceHistory,
        invitations: details.permissions,
        dealInterests: interests,
        investments: portfolio.investments,
        portfolioSummary: portfolio.portfolio,
      });
    },
  });

  return {
    listInvestors,
    getInvestorDetails,
  } satisfies ToolSet;
}

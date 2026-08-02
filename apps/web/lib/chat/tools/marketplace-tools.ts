import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getMarketplaceDeals } from "@repo/db/queries";
import { serializeForToolResult } from "@/lib/chat/tools/serialize";

export function createMarketplaceChatTools(options: {
  userId: string;
}): ToolSet {
  const { userId } = options;

  const listMarketplaceDeals = tool({
    description:
      "List deals currently visible in the deal marketplace for the signed-in user. Use when the user asks what deals are available, live, or in the marketplace. Respects the user's clearance and deal invitations.",
    inputSchema: z.object({
      search: z
        .string()
        .optional()
        .describe("Optional search across deal name, sector, geography, summary."),
      status: z
        .string()
        .optional()
        .describe(
          "Optional deal status filter: coming_soon, live, closing, funded, exited, cancelled, or all.",
        ),
      sector: z.string().optional().describe("Optional sector filter."),
      geography: z.string().optional().describe("Optional geography filter."),
      dealType: z
        .string()
        .optional()
        .describe("Optional deal type filter (e.g. Equity, Debt)."),
      page: z.number().int().min(1).optional().default(1),
      limit: z.number().int().min(1).max(50).optional().default(12),
    }),
    execute: async ({
      search,
      status,
      sector,
      geography,
      dealType,
      page,
      limit,
    }) => {
      const result = await getMarketplaceDeals({
        userId,
        page: page ?? 1,
        limit: limit ?? 12,
        search,
        status,
        sector,
        geography,
        dealType,
      });

      if (!result.success) {
        return {
          success: false,
          message: "Could not load marketplace deals.",
          deals: [],
        };
      }

      const emptyBecauseNotApproved =
        result.deals.length === 0 &&
        result.clearanceStatus !== "approved";

      return serializeForToolResult({
        success: true,
        clearanceStatus: result.clearanceStatus,
        message: emptyBecauseNotApproved
          ? "No marketplace deals are visible yet. Investor must be approved and invited to live deals."
          : undefined,
        pagination: result.pagination,
        deals: result.deals.map((d) => ({
          id: d.id,
          name: d.name,
          status: d.status,
          sector: d.sector,
          geography: d.geography,
          teaserSummary: d.teaserSummary,
          targetRaise: d.targetRaise,
          minInvestment: d.minInvestment,
          targetIrr: d.targetIrr,
          targetMoic: d.targetMoic,
          launchDate: d.launchDate,
          closeDate: d.closeDate,
          isCurated: d.isCurated,
          curationNote: d.curationNote,
        })),
      });
    },
  });

  return {
    listMarketplaceDeals,
  } satisfies ToolSet;
}

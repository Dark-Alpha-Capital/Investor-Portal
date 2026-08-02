import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { authSession } from "@/lib/auth/session-from-request";
import { getMarketplaceDeals } from "@repo/db/queries";

export const marketplaceDealsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  sector: z.string().optional(),
  geography: z.string().optional(),
  dealType: z.string().optional(),
});

export type MarketplaceDealsSearch = z.infer<
  typeof marketplaceDealsSearchSchema
>;

export type MarketplaceDealsData = Awaited<
  ReturnType<typeof getMarketplaceDeals>
>;

const PAGE_SIZE = 12;

export function normalizeMarketplaceDealsDeps(search: MarketplaceDealsSearch) {
  return {
    page: search.page ?? 1,
    search: search.search?.trim() || undefined,
    sector:
      search.sector && search.sector !== "all" ? search.sector : undefined,
    geography:
      search.geography && search.geography !== "all"
        ? search.geography
        : undefined,
    dealType:
      search.dealType && search.dealType !== "all"
        ? search.dealType
        : undefined,
  };
}

export const loadMarketplaceDeals = createServerFn({ method: "GET" })
  .validator((data: unknown) => marketplaceDealsSearchSchema.parse(data))
  .handler(async ({ data: deps }): Promise<MarketplaceDealsData> => {
    const session = await authSession();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const normalized = normalizeMarketplaceDealsDeps(deps);

    return getMarketplaceDeals({
      userId: session.user.id,
      page: normalized.page,
      limit: PAGE_SIZE,
      search: normalized.search,
      sector: normalized.sector,
      geography: normalized.geography,
      dealType: normalized.dealType,
    });
  });

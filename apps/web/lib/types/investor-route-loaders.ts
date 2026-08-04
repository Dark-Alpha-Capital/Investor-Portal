import type { ClearanceStatus } from "@/lib/auth/permissions";
import type { DealFile } from "@/lib/deals/list-deal-files";

type PortfolioPayload = Awaited<
  ReturnType<typeof import("@repo/db/queries").getPortfolioData>
>;

export type DashboardLoaderData =
  | { view: "onboarding" }
  | { view: "rejected" }
  | { view: "review" }
  | {
      view: "main";
      portfolioData: PortfolioPayload;
      clearanceStatus: ClearanceStatus | null;
      clearanceConditions: string[] | null;
    };

type MarketplacePayload = Awaited<
  ReturnType<typeof import("@repo/db/queries").getMarketplaceDeals>
>;

export type DealsLoaderData = {
  initialData: MarketplacePayload;
};

type GetDealResult = Awaited<
  ReturnType<typeof import("@repo/db/queries").getDealForView>
>;
type OkDeal = Extract<GetDealResult, { success: true }>;
type ForbiddenDeal = Extract<
  GetDealResult,
  { success: false; error: "FORBIDDEN" }
>;

export type DealDetailLoaderData =
  | { dealId: string; kind: "ok"; result: OkDeal; files: DealFile[] }
  | {
      dealId: string;
      kind: "forbidden";
      clearanceStatus: ForbiddenDeal["clearanceStatus"];
    }
  | { dealId: string; kind: "deleted" };

export const investorDealDetailQueryKey = (dealId: string) =>
  ["investor", "deal", dealId] as const;

export const marketplaceDealsQueryKey = (
  deps: Record<string, unknown>,
) => ["investor", "marketplace-deals", deps] as const;

export const myInvestmentsQueryKey = (deps: Record<string, unknown>) =>
  ["investor", "my-investments", deps] as const;

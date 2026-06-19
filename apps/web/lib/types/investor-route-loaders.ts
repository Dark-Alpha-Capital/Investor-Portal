import type { ClearanceStatus } from "@/lib/permissions";

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
  | { dealId: string; kind: "ok"; result: OkDeal }
  | {
      dealId: string;
      kind: "forbidden";
      clearanceStatus: ForbiddenDeal["clearanceStatus"];
    };

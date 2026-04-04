import type { ClearanceStatus } from "@/lib/permissions";
import type { AuthedSession } from "@/lib/route-auth";
import { authSession } from "@/lib/auth-session-from-request";
import type {
  DashboardLoaderData,
  DealDetailLoaderData,
  DealsLoaderData,
} from "@/lib/types/investor-route-loaders";
import type { DealIdInput, RouteSearchStringInput } from "@/lib/schemas/server-fn/inputs";
import {
  getClearanceData,
  getDealForView,
  getMarketplaceDeals,
  getPortfolioData,
  getUserWithKycAndClearance,
} from "@repo/db/queries";

/** `(dashboard)` layout `beforeLoad` — must use server fn (loaders/layout modules run on client too). */
export type RouteSessionGuardResult =
  | { tag: "ok"; session: AuthedSession }
  | { tag: "redirect"; to: "/login" };

export async function runFetchSessionForDashboardLayout(): Promise<RouteSessionGuardResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  return { tag: "ok", session: session as AuthedSession };
}

export type DashboardLoaderFetchResult =
  | { tag: "ok"; data: DashboardLoaderData }
  | { tag: "redirect"; to: "/login" };

export async function runFetchDashboardRouteData(): Promise<DashboardLoaderFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const userId = session.user.id;
  const userData = await getUserWithKycAndClearance(userId);

  if (!userData) {
    return { tag: "redirect", to: "/login" };
  }

  if (!userData.isOnboardingCompleted) {
    return { tag: "ok", data: { view: "onboarding" } };
  }

  const clearanceStatus =
    (userData.clearanceStatus as ClearanceStatus) ?? "pending";

  switch (clearanceStatus) {
    case "cleared":
    case "cleared_with_conditions": {
      const [portfolioData, clearanceData] = await Promise.all([
        getPortfolioData(userId),
        getClearanceData(userId),
      ]);
      return {
        tag: "ok",
        data: {
          view: "main",
          portfolioData,
          clearanceStatus:
            (clearanceData.clearance?.status as ClearanceStatus) ?? null,
          clearanceConditions:
            (clearanceData.clearance?.conditionsJson as string[]) ?? null,
        },
      };
    }
    case "rejected":
      return { tag: "ok", data: { view: "rejected" } };
    case "pending":
    default:
      return { tag: "ok", data: { view: "review" } };
  }
}

export type MarketplaceDealsFetchResult =
  | { tag: "ok"; data: DealsLoaderData }
  | { tag: "redirect"; to: "/login" };

export async function runFetchMarketplaceDealsRouteData(
  data: RouteSearchStringInput,
): Promise<MarketplaceDealsFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const userId = session.user.id;
  const sp = new URLSearchParams(data.search);
  const page = parseInt(sp.get("page") || "1", 10);
  const search = sp.get("search") || undefined;
  const statusRaw = sp.get("status");
  const status =
    statusRaw && statusRaw !== "all" ? statusRaw : undefined;
  const sectorRaw = sp.get("sector");
  const sector =
    sectorRaw && sectorRaw !== "all" ? sectorRaw : undefined;

  const initialData = await getMarketplaceDeals({
    userId,
    page,
    limit: 12,
    search,
    status,
    sector,
  });

  return { tag: "ok", data: { initialData } };
}

export type DealDetailFetchResult =
  | { tag: "ok"; data: DealDetailLoaderData }
  | { tag: "redirect"; to: "/login" }
  | { tag: "not_found" };

export async function runFetchDealDetailRouteData(
  data: DealIdInput,
): Promise<DealDetailFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const { dealId } = data;
  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";

  const result = await getDealForView({ dealId, userId, isAdmin });

  if (!result.success) {
    if (result.error === "NOT_FOUND") {
      return { tag: "not_found" };
    }
    if (result.error === "FORBIDDEN") {
      return {
        tag: "ok",
        data: {
          dealId,
          kind: "forbidden",
          clearanceStatus: result.clearanceStatus,
        },
      };
    }
    console.error("[fetchDealDetailRouteData] unexpected error:", result);
    throw new Error("Failed to load deal");
  }

  return {
    tag: "ok",
    data: {
      dealId,
      kind: "ok",
      result,
    },
  };
}

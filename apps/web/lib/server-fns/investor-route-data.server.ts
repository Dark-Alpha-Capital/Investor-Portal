import type { ClearanceStatus } from "@/lib/auth/permissions";
import type { AuthedSession } from "@/lib/auth/route-auth";
import { authSession } from "@/lib/auth/session-from-request";
import type {
  DashboardLoaderData,
  DealDetailLoaderData,
  DealsLoaderData,
} from "@/lib/types/investor-route-loaders";
import type { DealIdInput, RouteSearchStringInput } from "@/lib/schemas/server-fn/inputs";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import { getDealFilesByDealId } from "@/lib/deals/list-deal-files";
import {
  getClearanceData,
  getDealForView,
  getMarketplaceDeals,
  getPortfolioData,
  getUserWithKycAndClearance,
  getUserWithKycStatus,
} from "@repo/db/queries";

/** `_dashboard` layout `beforeLoad` — must use server fn (loaders/layout modules run on client too). */
export type RouteSessionGuardResult =
  | { tag: "ok"; session: AuthedSession; isOnboardingCompleted: boolean }
  | { tag: "redirect"; to: "/login" };

export async function runFetchSessionForDashboardLayout(): Promise<RouteSessionGuardResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const userData = await getUserWithKycStatus(session.user.id);

  return {
    tag: "ok",
    session: session as AuthedSession,
    isOnboardingCompleted: userData?.isOnboardingCompleted ?? false,
  };
}

export type DashboardLoaderFetchResult =
  | { tag: "ok"; data: DashboardLoaderData }
  | { tag: "redirect"; to: "/login" | "/admin" };

export async function runFetchDashboardRouteData(): Promise<DashboardLoaderFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const userId = session.user.id;

  if (isAdminUser(session.user)) {
    return { tag: "redirect", to: "/admin" };
  }

  const userData = await getUserWithKycAndClearance(userId);

  if (!userData) {
    return { tag: "redirect", to: "/login" };
  }

  if (!userData.isOnboardingCompleted) {
    return { tag: "ok", data: { view: "onboarding" } };
  }

  const clearanceStatus =
    (userData.clearanceStatus as ClearanceStatus) ?? "pending_review";

  switch (clearanceStatus) {
    case "approved": {
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
    case "needs_information":
    case "pending_review":
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
  const geographyRaw = sp.get("geography");
  const geography =
    geographyRaw && geographyRaw !== "all" ? geographyRaw : undefined;
  const dealTypeRaw = sp.get("dealType");
  const dealType =
    dealTypeRaw && dealTypeRaw !== "all" ? dealTypeRaw : undefined;

  const initialData = await getMarketplaceDeals({
    userId,
    page,
    limit: 12,
    search,
    status,
    sector,
    geography,
    dealType,
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
    if (result.error === "DELETED") {
      return {
        tag: "ok",
        data: { dealId, kind: "deleted" },
      };
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

  const files = result.permissions.canViewDocuments
    ? await getDealFilesByDealId(result.deal.id)
    : [];

  return {
    tag: "ok",
    data: {
      dealId,
      kind: "ok",
      result,
      files,
    },
  };
}

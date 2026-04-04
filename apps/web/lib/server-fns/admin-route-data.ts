import { createServerFn } from "@tanstack/react-start";
import { authSession } from "@/lib/auth-session-from-request";
import { getTrpcCaller } from "@/trpc/server";
import {
  getAdminDeals,
  getDealDetail,
  getDealByIdForEdit,
  getInvestorsForCuration,
  getDealInvitesForCuration,
  getPendingInvestors,
  getInvestorComplianceDetails,
  getAllActiveDealsBasic,
} from "@repo/db/queries";
import { getDealFilesByDealId } from "@/lib/list-deal-files";

type RedirectTo = "/login" | "/dashboard" | "/admin/deals";

async function ensureAdminSession():
  | { tag: "redirect"; to: RedirectTo }
  | { tag: "ok"; userId: string } {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  if (session.user.role !== "admin") {
    return { tag: "redirect", to: "/dashboard" };
  }
  return { tag: "ok", userId: session.user.id };
}

export type AdminRouteRedirect = { tag: "redirect"; to: RedirectTo };

export type AdminHomeOk = {
  tag: "ok";
  dashboard: Awaited<
    ReturnType<
      Awaited<ReturnType<typeof getTrpcCaller>>["admin"]["getAdminDashboard"]
    >
  >;
};

export const fetchAdminHomePageData = createServerFn({ method: "GET" })
  .inputValidator((input: { search: string }) => input)
  .handler(
    async ({ data }): Promise<AdminRouteRedirect | AdminHomeOk> => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const sp = new URLSearchParams(data.search);
      const investorsPage = parseInt(sp.get("investorsPage") || "1", 10);
      const investorsSearch = sp.get("investorsSearch") || undefined;
      const investorsKycStatus =
        sp.get("investorsKycStatus") &&
        sp.get("investorsKycStatus") !== "all"
          ? sp.get("investorsKycStatus")!
          : undefined;
      const investorsVerified =
        sp.get("investorsVerified") &&
        sp.get("investorsVerified") !== "all"
          ? sp.get("investorsVerified")!
          : undefined;

      const adminsPage = parseInt(sp.get("adminsPage") || "1", 10);
      const adminsSearch = sp.get("adminsSearch") || undefined;
      const adminsVerified =
        sp.get("adminsVerified") && sp.get("adminsVerified") !== "all"
          ? sp.get("adminsVerified")!
          : undefined;
      const adminsStatus =
        sp.get("adminsStatus") && sp.get("adminsStatus") !== "all"
          ? sp.get("adminsStatus")!
          : undefined;

      const caller = await getTrpcCaller();
      const dashboard = await caller.admin.getAdminDashboard({
        investorsPage,
        investorsLimit: 12,
        investorsSearch,
        investorsKycStatus,
        investorsVerified,
        adminsPage,
        adminsLimit: 12,
        adminsSearch,
        adminsVerified,
        adminsStatus,
      });

      return { tag: "ok", dashboard };
    },
  );

export const fetchAdminDealsListData = createServerFn({ method: "GET" })
  .inputValidator((input: { search: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      | AdminRouteRedirect
      | { tag: "ok"; initialData: Awaited<ReturnType<typeof getAdminDeals>> }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const sp = new URLSearchParams(data.search);
      const page = parseInt(sp.get("dealsPage") || "1", 10);
      const search = sp.get("dealsSearch") || undefined;
      const status =
        sp.get("dealsStatus") && sp.get("dealsStatus") !== "all"
          ? sp.get("dealsStatus")!
          : undefined;
      const visibility =
        sp.get("dealsVisibility") && sp.get("dealsVisibility") !== "all"
          ? sp.get("dealsVisibility")!
          : undefined;

      const initialData = await getAdminDeals({
        page,
        limit: 12,
        search,
        status,
        visibility,
      });

      return { tag: "ok", initialData };
    },
  );

export type AdminDealDetailPayload = Awaited<
  ReturnType<typeof getDealDetail>
> & {
  files: Awaited<ReturnType<typeof getDealFilesByDealId>>;
};

export const fetchAdminDealDetailData = createServerFn({ method: "GET" })
  .inputValidator((input: { dealId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      AdminRouteRedirect | { tag: "not_found" } | { tag: "ok"; payload: AdminDealDetailPayload }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const [dealData, files] = await Promise.all([
        getDealDetail(data.dealId),
        getDealFilesByDealId(data.dealId),
      ]);

      if (!dealData.success || !dealData.deal) {
        return { tag: "not_found" };
      }

      return {
        tag: "ok",
        payload: { ...dealData, files },
      };
    },
  );

export type AdminDealEditFormData = {
  name: string;
  slug?: string;
  description?: string;
  teaserSummary?: string;
  sector?: string;
  geography?: string;
  dealType?: string;
  targetRaise?: string;
  minInvestment?: string;
  targetIrr?: string;
  targetMoic?: string;
  status: string;
  visibility: string;
  coverImageUrl?: string;
  launchDate?: Date | string | null;
  closeDate?: Date | string | null;
};

export const fetchAdminDealEditData = createServerFn({ method: "GET" })
  .inputValidator((input: { dealId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      AdminRouteRedirect | { tag: "missing" } | { tag: "ok"; formData: AdminDealEditFormData }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const result = await getDealByIdForEdit(data.dealId);

      if (!result.success || !result.deal) {
        return { tag: "missing" };
      }

      const deal = result.deal;
      const formData: AdminDealEditFormData = {
        name: deal.name,
        slug: deal.slug ?? undefined,
        description: deal.description ?? undefined,
        teaserSummary: deal.teaserSummary ?? undefined,
        sector: deal.sector ?? undefined,
        geography: deal.geography ?? undefined,
        dealType: deal.dealType ?? undefined,
        targetRaise: deal.targetRaise ?? undefined,
        minInvestment: deal.minInvestment ?? undefined,
        targetIrr: deal.targetIrr ?? undefined,
        targetMoic: deal.targetMoic ?? undefined,
        status: deal.status,
        visibility: deal.visibility,
        coverImageUrl: deal.coverImageUrl ?? undefined,
        launchDate: deal.launchDate ?? undefined,
        closeDate: deal.closeDate ?? undefined,
      };

      return { tag: "ok", formData };
    },
  );

export const fetchAdminDealCurateData = createServerFn({ method: "GET" })
  .inputValidator((input: { dealId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      | AdminRouteRedirect
      | {
          tag: "ok";
          investors: Awaited<ReturnType<typeof getInvestorsForCuration>>;
          invites: Awaited<ReturnType<typeof getDealInvitesForCuration>>;
        }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const [investors, invites] = await Promise.all([
        getInvestorsForCuration(),
        getDealInvitesForCuration(data.dealId),
      ]);

      return { tag: "ok", investors, invites };
    },
  );

export const fetchComplianceListData = createServerFn({ method: "GET" })
  .inputValidator((input: { search: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      | AdminRouteRedirect
      | {
          tag: "ok";
          initialData: Awaited<ReturnType<typeof getPendingInvestors>>;
          clearanceStatus: string;
        }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const sp = new URLSearchParams(data.search);
      const page = parseInt(sp.get("page") || "1", 10);
      const search = sp.get("search") || undefined;
      const clearanceStatusRaw = sp.get("clearanceStatus");
      const clearanceStatus =
        clearanceStatusRaw && clearanceStatusRaw !== "all"
          ? clearanceStatusRaw
          : undefined;

      const initialData = await getPendingInvestors({
        page,
        limit: 12,
        search,
        clearanceStatus,
      });

      return {
        tag: "ok",
        initialData,
        clearanceStatus: clearanceStatus || "all",
      };
    },
  );

type ComplianceDetailsOk = Extract<
  Awaited<ReturnType<typeof getInvestorComplianceDetails>>,
  { success: true }
>;

export type ComplianceInvestorLoaderData = {
  investorId: string;
  investor: ComplianceDetailsOk["investor"];
  onboarding: ComplianceDetailsOk["onboarding"];
  permissions: ComplianceDetailsOk["permissions"];
  auditLog: ComplianceDetailsOk["auditLog"];
  availableDeals: { id: string; name: string; status: string }[];
};

export const fetchComplianceInvestorData = createServerFn({ method: "GET" })
  .inputValidator((input: { investorId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      AdminRouteRedirect | { tag: "not_found" } | { tag: "ok"; data: ComplianceInvestorLoaderData }
    > => {
      const g = await ensureAdminSession();
      if (g.tag === "redirect") {
        return g;
      }

      const [detail, deals] = await Promise.all([
        getInvestorComplianceDetails(data.investorId),
        getAllActiveDealsBasic(),
      ]);

      if (!detail.success || !detail.investor) {
        return { tag: "not_found" };
      }

      const availableDeals = deals
        .filter((d) => d.status !== "draft")
        .map((d) => ({
          id: d.id,
          name: d.name,
          status: d.status,
        }));

      return {
        tag: "ok",
        data: {
          investorId: data.investorId,
          investor: detail.investor,
          onboarding: detail.onboarding,
          permissions: detail.permissions,
          auditLog: detail.auditLog,
          availableDeals,
        },
      };
    },
  );


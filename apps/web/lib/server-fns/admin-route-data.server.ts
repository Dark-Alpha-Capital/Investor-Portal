import { getTrpcCaller } from "@/trpc/server";
import type {
  DealIdInput,
  InvestorIdInput,
  RouteSearchStringInput,
} from "@/lib/schemas/server-fn/inputs";
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

export type AdminHomeOk = {
  tag: "ok";
  dashboard: Awaited<
    ReturnType<
      Awaited<ReturnType<typeof getTrpcCaller>>["admin"]["getAdminDashboard"]
    >
  >;
};

export async function runFetchAdminHomePageData(
  data: RouteSearchStringInput,
): Promise<AdminHomeOk> {
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
}

export async function runFetchAdminDealsListData(
  data: RouteSearchStringInput,
): Promise<{
  tag: "ok";
  initialData: Awaited<ReturnType<typeof getAdminDeals>>;
}> {
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
}

export type AdminDealDetailPayload = Awaited<
  ReturnType<typeof getDealDetail>
> & {
  files: Awaited<ReturnType<typeof getDealFilesByDealId>>;
};

export async function runFetchAdminDealDetailData(
  data: DealIdInput,
): Promise<
  { tag: "not_found" } | { tag: "ok"; payload: AdminDealDetailPayload }
> {
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
}

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

export async function runFetchAdminDealEditData(
  data: DealIdInput,
): Promise<
  { tag: "missing" } | { tag: "ok"; formData: AdminDealEditFormData }
> {
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
}

export async function runFetchAdminDealCurateData(
  data: DealIdInput,
): Promise<{
  tag: "ok";
  investors: Awaited<ReturnType<typeof getInvestorsForCuration>>;
  invites: Awaited<ReturnType<typeof getDealInvitesForCuration>>;
}> {
  const [investors, invites] = await Promise.all([
    getInvestorsForCuration(),
    getDealInvitesForCuration(data.dealId),
  ]);

  return { tag: "ok", investors, invites };
}

export async function runFetchComplianceListData(
  data: RouteSearchStringInput,
): Promise<{
  tag: "ok";
  initialData: Awaited<ReturnType<typeof getPendingInvestors>>;
  clearanceStatus: string;
}> {
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
}

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

export async function runFetchComplianceInvestorData(
  data: InvestorIdInput,
): Promise<
  { tag: "not_found" } | { tag: "ok"; data: ComplianceInvestorLoaderData }
> {
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
}

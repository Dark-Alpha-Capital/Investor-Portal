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
  getInvestorComplianceDetails,
  listKnowledgeRequestsByDeal,
} from "@repo/db/queries";
import { getDealFilesByDealId } from "@/lib/deals/list-deal-files";

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

  const initialData = await getAdminDeals({
    page,
    limit: 12,
    search,
    status,
  });

  return { tag: "ok", initialData };
}

export type AdminDealDetailPayload = Awaited<
  ReturnType<typeof getDealDetail>
> & {
  files: Awaited<ReturnType<typeof getDealFilesByDealId>>;
  questions: Awaited<ReturnType<typeof listKnowledgeRequestsByDeal>>;
  openQuestionsCount: number;
};

export async function runFetchAdminDealDetailData(
  data: DealIdInput,
): Promise<
  { tag: "not_found" } | { tag: "ok"; payload: AdminDealDetailPayload }
> {
  const [dealData, files, questions] = await Promise.all([
    getDealDetail(data.dealId),
    getDealFilesByDealId(data.dealId),
    listKnowledgeRequestsByDeal({ dealId: data.dealId }),
  ]);

  if (!dealData.success || !dealData.deal) {
    return { tag: "not_found" };
  }

  const openQuestionsCount = questions.filter((q) => q.status === "open").length;

  return {
    tag: "ok",
    payload: { ...dealData, files, questions, openQuestionsCount },
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
  status:
    | "draft"
    | "coming_soon"
    | "live"
    | "closing"
    | "funded"
    | "exited"
    | "cancelled";
  launchDate?: Date | string | null;
  closeDate?: Date | string | null;
  targetCompany?: string;
  revenue?: string;
  ebitda?: string;
  holdPeriod?: string;
  investmentThesis?: string;
  risks?: string;
  purchasePrice?: string;
  debt?: string;
  sponsorEquity?: string;
  lpEquity?: string;
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
    launchDate: deal.launchDate ?? undefined,
    closeDate: deal.closeDate ?? undefined,
    targetCompany: deal.targetCompany ?? undefined,
    revenue: deal.revenue ?? undefined,
    ebitda: deal.ebitda ?? undefined,
    holdPeriod: deal.holdPeriod ?? undefined,
    investmentThesis: deal.investmentThesis ?? undefined,
    risks: deal.risks ?? undefined,
    purchasePrice: deal.purchasePrice ?? undefined,
    debt: deal.debt ?? undefined,
    sponsorEquity: deal.sponsorEquity ?? undefined,
    lpEquity: deal.lpEquity ?? undefined,
  };

  return { tag: "ok", formData };
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
};

export async function runFetchComplianceInvestorData(
  data: InvestorIdInput,
): Promise<
  { tag: "not_found" } | { tag: "ok"; data: ComplianceInvestorLoaderData }
> {
  const detail = await getInvestorComplianceDetails(data.investorId);

  if (!detail.success || !detail.investor) {
    return { tag: "not_found" };
  }

  return {
    tag: "ok",
    data: {
      investorId: data.investorId,
      investor: detail.investor,
      onboarding: detail.onboarding,
      permissions: detail.permissions,
      auditLog: detail.auditLog,
    },
  };
}

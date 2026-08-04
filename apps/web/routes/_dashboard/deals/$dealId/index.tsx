import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link as RouterLink,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import {
  investorDealDetailQueryKey,
  type DealDetailLoaderData,
} from "@/lib/types/investor-route-loaders";
import { fetchDealDetailRouteData } from "@/lib/server-fns/investor-route-data";
import { sanitizeHtml } from "@/lib/helpers/sanitize-html";
import { AppLink as Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Info,
  Lightbulb,
  PieChart,
  FolderOpen,
  Sparkles,
  ArchiveX,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { DealHeader } from "./components/deal-header";
import { UserStatusCard } from "./components/user-status-card";
import { DealActions } from "./components/deal-actions";
import { DealAccessDenied } from "./components/deal-access-denied";
import { DealNoLongerAvailable } from "./components/deal-no-longer-available";
import { DealExecutiveSummary } from "./components/deal-executive-summary";
import { DealThesisRisks } from "./components/deal-thesis-risks";
import { DealCapitalStructure } from "./components/deal-capital-structure";
import { DealDocuments } from "./components/deal-documents";
import { ClosingPackagePanel } from "@/components/closing/closing-package-panel";
import type { DealFile } from "@/lib/deals/list-deal-files";

type GetDealResult = Awaited<
  ReturnType<typeof import("@repo/db/queries").getDealForView>
>;
type OkDeal = Extract<GetDealResult, { success: true }>;
type ForbiddenDeal = Extract<
  GetDealResult,
  { success: false; error: "FORBIDDEN" }
>;

const searchSchema = z.object({
  tab: z
    .enum(["overview", "thesis", "capital", "documents", "actions"])
    .optional(),
});

type DealTab = NonNullable<z.infer<typeof searchSchema>["tab"]>;

export function investorDealDetailQueryOptions(dealId: string) {
  return queryOptions({
    queryKey: investorDealDetailQueryKey(dealId),
    queryFn: async (): Promise<DealDetailLoaderData> => {
      const r = await fetchDealDetailRouteData({
        data: { dealId },
      });
      if (r.tag === "redirect") {
        throw redirect({ to: r.to });
      }
      if (r.tag === "not_found") {
        throw notFound();
      }
      return r.data;
    },
  });
}

function forbiddenReason(
  clearanceStatus: ForbiddenDeal["clearanceStatus"],
): string {
  if (clearanceStatus === "approved") {
    return "You are approved but have not been invited to this deal. Please contact your relationship manager for access.";
  }
  if (clearanceStatus === "pending_review") {
    return "Your KYC is still pending review. Once approved, you can be invited to deals.";
  }
  if (clearanceStatus === "needs_information") {
    return "Additional information is required before approval. Check your dashboard for details.";
  }
  if (clearanceStatus === "rejected") {
    return "Your account was not approved. Please contact the compliance team for more information.";
  }
  return "You don't have access to this deal. Please contact support if you believe this is an error.";
}

const dealTabs: Array<{ value: DealTab; label: string; icon: typeof Info }> = [
  { value: "overview", label: "Overview", icon: Info },
  { value: "thesis", label: "Thesis & Risks", icon: Lightbulb },
  { value: "capital", label: "Capital", icon: PieChart },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "actions", label: "Actions", icon: User },
];

function DealTabs({
  dealId,
  result,
  files,
  activeTab,
  onTabChange,
}: {
  dealId: string;
  result: OkDeal;
  files: DealFile[];
  activeTab: DealTab;
  onTabChange: (value: string) => void;
}) {
  const deal = result.deal;
  const description = hasBody(deal.description) ? deal.description : null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-8 grid w-full grid-cols-2 gap-1 h-auto sm:grid-cols-5">
        {dealTabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <div className="space-y-10">
          <UserStatusCard
            userInterest={result.userInterest}
            userInvestment={result.userInvestment}
            permissions={result.permissions}
          />
          <DealExecutiveSummary deal={deal} />
          {description ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">
                About the Deal
              </h2>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(description),
                }}
              />
            </section>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="thesis" className="mt-0">
        <DealThesisRisks
          investmentThesis={deal.investmentThesis}
          risks={deal.risks}
        />
      </TabsContent>

      <TabsContent value="capital" className="mt-0">
        <DealCapitalStructure
          purchasePrice={deal.purchasePrice}
          debt={deal.debt}
          sponsorEquity={deal.sponsorEquity}
          lpEquity={deal.lpEquity}
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <DealDocuments
          files={files}
          canViewDocuments={result.permissions.canViewDocuments}
        />
      </TabsContent>

      <TabsContent value="actions" className="mt-0">
        {result.userInvestment ? (
          <ClosingPackagePanel
            dealId={dealId}
            investmentId={result.userInvestment.id}
          />
        ) : (
          <DealActions
            dealId={dealId}
            userInterest={result.userInterest}
            minInvestment={deal.minInvestment}
            permissions={result.permissions}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

function hasBody(html: string | null | undefined): boolean {
  if (!html) return false;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  );
}

function DealDetailContent({ data }: { data: DealDetailLoaderData }) {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const askAiDealId = data.kind === "ok" ? data.result.deal.id : null;
  const activeTab = (tab ?? "overview") as DealTab;
  const handleTabChange = (value: string) => {
    void navigate({
      search: (current) => ({
        ...current,
        tab: value === "overview" ? undefined : (value as DealTab),
      }),
    });
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/deals">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Deals
            </Button>
          </Link>
          {askAiDealId ? (
            <Button asChild size="sm" variant="outline">
              <RouterLink search={{ dealId: askAiDealId }} to="/chat">
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI
              </RouterLink>
            </Button>
          ) : null}
        </div>

        {data.kind === "deleted" ? (
          <DealNoLongerAvailable />
        ) : data.kind === "forbidden" ? (
          <DealAccessDenied
            clearanceStatus={data.clearanceStatus}
            reason={forbiddenReason(data.clearanceStatus)}
          />
        ) : (
          <>
            {data.result.deal.deletedAt ? (
              <Alert className="mb-6 border-destructive/40 bg-destructive/10">
                <ArchiveX className="h-4 w-4 text-destructive" />
                <AlertTitle>Deal Removed</AlertTitle>
                <AlertDescription>
                  This deal has been removed and is hidden from investors. You
                  are seeing it because you are viewing as an admin.
                </AlertDescription>
              </Alert>
            ) : null}
            <DealHeader
              deal={data.result.deal}
              curationNote={data.result.curationNote}
            />
            <div className="mt-8">
              <DealTabs
                dealId={data.dealId}
                result={data.result}
                files={data.files}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_dashboard/deals/$dealId/")({
  validateSearch: (search) => {
    const parsed = searchSchema.safeParse(search);
    return parsed.success ? parsed.data : {};
  },
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(
      investorDealDetailQueryOptions(params.dealId),
    );
  },
  component: DealDetailRoutePage,
});

function DealDetailRoutePage() {
  const { dealId } = Route.useParams();
  const { data, isLoading }: UseQueryResult<DealDetailLoaderData> = useQuery(
    investorDealDetailQueryOptions(dealId),
  );

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <DealDetailContent data={data} />;
}

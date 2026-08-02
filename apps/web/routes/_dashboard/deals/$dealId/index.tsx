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
import {
  investorDealDetailQueryKey,
  type DealDetailLoaderData,
} from "@/lib/types/investor-route-loaders";
import { fetchDealDetailRouteData } from "@/lib/server-fns/investor-route-data";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealHeader } from "./components/deal-header";
import { UserStatusCard } from "./components/user-status-card";
import { DealActions } from "./components/deal-actions";
import { DealAccessDenied } from "./components/deal-access-denied";
import { DealExecutiveSummary } from "./components/deal-executive-summary";
import { DealThesisRisks } from "./components/deal-thesis-risks";
import { DealCapitalStructure } from "./components/deal-capital-structure";
import { DealDocuments } from "./components/deal-documents";
import type { DealFile } from "@/lib/deals/list-deal-files";

type GetDealResult = Awaited<
  ReturnType<typeof import("@repo/db/queries").getDealForView>
>;
type OkDeal = Extract<GetDealResult, { success: true }>;
type ForbiddenDeal = Extract<
  GetDealResult,
  { success: false; error: "FORBIDDEN" }
>;

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

function DealTabs({
  dealId,
  result,
  files,
}: {
  dealId: string;
  result: OkDeal;
  files: DealFile[];
}) {
  const deal = result.deal;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="thesis" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Thesis & Risks
        </TabsTrigger>
        <TabsTrigger value="capital" className="flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Capital
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="actions" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Actions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <div className="space-y-6">
          <DealHeader deal={deal} curationNote={result.curationNote} />
          <UserStatusCard
            userInterest={result.userInterest}
            userInvestment={result.userInvestment}
            permissions={result.permissions}
          />
          <DealExecutiveSummary deal={deal} />
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
          <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
            <p className="font-medium text-foreground">
              Capital commitment on file
            </p>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              {result.userInvestment.status === "funded"
                ? "Funded"
                : "Committed"}
              {result.userInvestment.committedAmount
                ? ` · ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(parseFloat(result.userInvestment.committedAmount))}`
                : null}
            </p>
          </div>
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

function DealDetailContent({ data }: { data: DealDetailLoaderData }) {
  const askAiDealId = data.kind === "ok" ? data.result.deal.id : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link href="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deals
            </Button>
          </Link>
          {askAiDealId ? (
            <Button
              asChild
              size="sm"
              className="border-0 bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:from-sky-500 hover:via-indigo-500 hover:to-violet-500 hover:text-white"
            >
              <RouterLink search={{ dealId: askAiDealId }} to="/chat">
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI
              </RouterLink>
            </Button>
          ) : null}
        </div>

        {data.kind === "forbidden" ? (
          <DealAccessDenied
            clearanceStatus={data.clearanceStatus}
            reason={forbiddenReason(data.clearanceStatus)}
          />
        ) : (
          <DealTabs
            dealId={data.dealId}
            result={data.result}
            files={data.files}
          />
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_dashboard/deals/$dealId/")({
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

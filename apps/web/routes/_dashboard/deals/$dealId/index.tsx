import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import type { DealDetailLoaderData } from "@/lib/types/investor-route-loaders";
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

type GetDealResult = Awaited<
  ReturnType<typeof import("@repo/db/queries").getDealForView>
>;
type OkDeal = Extract<GetDealResult, { success: true }>;
type ForbiddenDeal = Extract<
  GetDealResult,
  { success: false; error: "FORBIDDEN" }
>;

function forbiddenReason(
  clearanceStatus: ForbiddenDeal["clearanceStatus"],
): string {
  if (clearanceStatus === "cleared_with_conditions") {
    return "You have been cleared with conditions, but you don't have specific permission to view this deal. Please contact your relationship manager or the compliance team for access.";
  }
  if (clearanceStatus === "pending") {
    return "Your compliance clearance is still pending review. Once cleared, you'll be able to access deals.";
  }
  if (clearanceStatus === "rejected") {
    return "Your compliance clearance was not approved. Please contact the compliance team for more information.";
  }
  return "You don't have permission to view this deal. Please contact support if you believe this is an error.";
}

function DealTabs({ dealId, result }: { dealId: string; result: OkDeal }) {
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
          dealId={deal.id}
          canViewDocuments={result.permissions.canViewDocuments}
        />
      </TabsContent>

      <TabsContent value="actions" className="mt-0">
        {result.userInvestment ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            You already have an investment in this deal.
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
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-border pb-5">
          <Link href="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Available Investments
            </Button>
          </Link>
        </div>

        {data.kind === "forbidden" ? (
          <DealAccessDenied
            clearanceStatus={data.clearanceStatus}
            reason={forbiddenReason(data.clearanceStatus)}
          />
        ) : (
          <DealTabs dealId={data.dealId} result={data.result} />
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_dashboard/deals/$dealId/")({
  loader: async ({ params }: { params: { dealId: string } }) => {
    const r = await fetchDealDetailRouteData({
      data: { dealId: params.dealId },
    });
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    if (r.tag === "not_found") {
      throw notFound();
    }
    return r.data;
  },
  component: DealDetailRoutePage,
});

function DealDetailRoutePage() {
  const data = Route.useLoaderData();
  return <DealDetailContent data={data} />;
}

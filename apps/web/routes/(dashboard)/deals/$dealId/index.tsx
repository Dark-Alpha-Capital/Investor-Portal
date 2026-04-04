import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import type { DealDetailLoaderData } from "@/lib/types/investor-route-loaders";
import { fetchDealDetailRouteData } from "@/lib/server-fns/investor-route-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealHeader } from "./components/deal-header";
import { UserStatusCard } from "./components/user-status-card";
import { DealActions } from "./components/deal-actions";
import { DealInformation } from "./components/deal-information";
import { DealAccessDenied } from "./components/deal-access-denied";

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
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="actions" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Actions
        </TabsTrigger>
        <TabsTrigger value="information" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Information
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <div className="space-y-6">
          <DealHeader deal={result.deal} curationNote={result.curationNote} />
          <UserStatusCard
            userInterest={result.userInterest}
            userInvestment={result.userInvestment}
            permissions={result.permissions}
          />
        </div>
      </TabsContent>

      <TabsContent value="actions" className="mt-0">
        {result.userInvestment ? null : (
          <DealActions
            dealId={dealId}
            userInterest={result.userInterest}
            minInvestment={result.deal.minInvestment}
            permissions={result.permissions}
          />
        )}
      </TabsContent>

      <TabsContent value="information" className="mt-0">
        <DealInformation deal={result.deal} />
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
              Back to Deals
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

export const Route = createFileRoute("/(dashboard)/deals/$dealId/")({
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

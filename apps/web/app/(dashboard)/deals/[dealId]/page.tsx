import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authSession } from "@/app/(auth)/auth";
import { getDealForView } from "@repo/db/queries";
import { DealHeader } from "./components/deal-header";
import { UserStatusCard } from "./components/user-status-card";
import { DealActions } from "./components/deal-actions";
import { DealInformation } from "./components/deal-information";
import { DealAccessDenied } from "./components/deal-access-denied";
import { DealDetailSkeleton } from "@/components/skeleton/deal-detail-skeleton";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

async function FetchDealDetailWrapper({
  dealId,
  userId,
  isAdmin,
}: {
  dealId: string;
  userId: string;
  isAdmin: boolean;
}) {
  const result = await getDealForView({ dealId, userId, isAdmin });

  if (!result.success) {
    if (result.error === "NOT_FOUND") {
      notFound();
    }
    if (result.error === "FORBIDDEN") {
      return (
        <DealAccessDenied
          clearanceStatus={result.clearanceStatus}
          reason={
            result.clearanceStatus === "cleared_with_conditions"
              ? "You have been cleared with conditions, but you don't have specific permission to view this deal. Please contact your relationship manager or the compliance team for access."
              : result.clearanceStatus === "pending"
                ? "Your compliance clearance is still pending review. Once cleared, you'll be able to access deals."
                : result.clearanceStatus === "rejected"
                  ? "Your compliance clearance was not approved. Please contact the compliance team for more information."
                  : "You don't have permission to view this deal. Please contact support if you believe this is an error."
          }
        />
      );
    }
    throw new Error("Failed to fetch deal");
  }

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

async function FetchDealDetail({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const [paramsData, sessionData] = await Promise.all([params, authSession()]);

  if (!sessionData?.user) {
    redirect("/login");
  }

  const { dealId } = paramsData;
  const userId = sessionData.user.id;

  return (
    <FetchDealDetailWrapper
      dealId={dealId}
      userId={userId}
      isAdmin={sessionData.user.role === "admin" ? true : false}
    />
  );
}

export default async function DealDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deals
            </Button>
          </Link>
        </div>

        <Suspense fallback={<DealDetailSkeleton />}>
          <FetchDealDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}

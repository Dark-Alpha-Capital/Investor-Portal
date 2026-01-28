import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import {
  getInvestorsForCuration,
  getDealInvitesForCuration,
} from "@repo/db/queries";
import { DealCurationTabs } from "@/components/deal-curation-tabs";
import BackButton from "@/components/back-button";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * Curate Deal Page
 *
 * Auth is handled in the FetchDealCuration component
 * This page uses Suspense to stream the deal curation data.
 */
export default function CurateDealPage({ params }: PageProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Static shell - prerendered */}
      <div className="mb-8 mt-6 flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curate Deal</h1>
          <p className="text-muted-foreground mt-2">
            Select which investors can see this deal
          </p>
        </div>
      </div>

      {/* Dynamic content - streamed */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading investors...
            </div>
          </div>
        }
      >
        <FetchDealCuration params={params} />
      </Suspense>
    </div>
  );
}

async function FetchDealCuration({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const [paramsData, sessionData] = await Promise.all([params, authSession()]);

  if (!sessionData?.user || sessionData.user.role !== "admin") {
    redirect("/login");
  }

  const { dealId } = paramsData;

  return <FetchDealCurationWrapper dealId={dealId} />;
}

async function FetchDealCurationWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  const [investors, invites] = await Promise.all([
    getInvestorsForCuration(),
    getDealInvitesForCuration(dealId),
  ]);

  return (
    <DealCurationTabs dealId={dealId} investors={investors} invites={invites} />
  );
}

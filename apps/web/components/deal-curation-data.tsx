import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { DealCurationTabs } from "./deal-curation-tabs";

type DealCurationDataProps = {
  params: Promise<{
    dealId: string;
  }>;
};

export async function DealCurationData({ params }: DealCurationDataProps) {
  // Auth is handled in the layout - no need to check here
  const { dealId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading investors...
          </div>
        </div>
      }
    >
      <FetchDealCurationWrapper dealId={dealId} />
    </Suspense>
  );
}

async function FetchDealCurationWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  const [investorsResult, invitesResult] = await Promise.all([
    caller.deals.getInvestors(),
    caller.deals.getInvites({ dealId }),
  ]);

  return (
    <DealCurationTabs
      dealId={dealId}
      investors={investorsResult.investors}
      invites={invitesResult.invites}
    />
  );
}

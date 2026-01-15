import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Edit } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { DescriptionTab } from "./description-tab";
import { InvitesTab } from "./invites-tab";
import { InterestsTab } from "./interests-tab";
import { InvestmentsTabWrapper } from "./investments-tab-wrapper";
import { FilesTabServer } from "./files-tab-server";
import { TabCounts } from "./tab-counts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { caller } from "@/trpc/server";
import { Suspense } from "react";
import { DealDetailSkeleton } from "@/components/skeleton/deal-detail-skeleton";

type DealDetailContentProps = {
  params: Promise<{
    dealId: string;
  }>;
};

export async function DealDetailContent({ params }: DealDetailContentProps) {
  // Auth is handled in the layout - no need to check here
  const { dealId } = await params;

  return (
    <>
      <Suspense fallback={<DealDetailSkeleton />}>
        <FetchDealDetailWrapper dealId={dealId} />
      </Suspense>
    </>
  );
}

async function FetchDealDetailWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  const data = await caller.admin.getDealDetail({ dealId });
  if (!data.success || !data.deal) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Deal not found</h2>
          <p className="text-muted-foreground">
            The deal you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex gap-2">
          <Link href={`/admin/deals/${dealId}/curate`}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Curate
            </Button>
          </Link>
          <Link href={`/admin/deals/${dealId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Deal
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 mt-6">
        <TabCounts
          invitesCount={data.invites.length}
          interestsCount={data.interests.length}
          investmentsCount={data.investments.length}
          filesCount={data.files.length}
        />

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewTab deal={data.deal} />
        </TabsContent>

        <TabsContent value="description" className="space-y-4 mt-6">
          <DescriptionTab deal={data.deal} />
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 mt-6">
          <InvitesTab invites={data.invites} />
        </TabsContent>

        <TabsContent value="interests" className="space-y-4 mt-6">
          <InterestsTab interests={data.interests} />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 mt-6">
          <InvestmentsTabWrapper
            dealId={dealId}
            investments={data.investments}
            interests={data.interests}
          />
        </TabsContent>

        <TabsContent value="files" className="space-y-4 mt-6">
          <FilesTabServer dealId={dealId} files={data.files} />
        </TabsContent>
      </Tabs>
    </>
  );
}

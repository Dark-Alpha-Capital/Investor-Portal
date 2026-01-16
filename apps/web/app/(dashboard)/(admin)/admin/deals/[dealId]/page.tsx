import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Edit } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { OverviewTab } from "@/components/deal-overview-tab";
import { DescriptionTab } from "@/components/deal-description-tab";
import { InvitesTab } from "@/components/deal-invites-tab";
import { InterestsTab } from "@/components/deal-interests-tab";
import { TabCounts } from "@/components/deal-tab-counts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DealDetailSkeleton } from "@/components/skeleton/deal-detail-skeleton";
import { getDealDetail } from "@repo/db/queries";
import { getDealFilesByDealId } from "@/lib/list-deal-files";
import { InvestmentsTab } from "@/components/deal-investments-tab";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DealFilesTab } from "@/components/deal-files-tab";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

async function FetchDealDetailWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  // Fetch deal data and files in parallel
  const [dealData, files] = await Promise.all([
    getDealDetail(dealId),
    getDealFilesByDealId(dealId),
  ]);

  if (!dealData.success || !dealData.deal) {
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

  const data = {
    ...dealData,
    files,
  };

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
          <InvestmentsTab
            dealId={dealId}
            investments={data.investments}
            interests={data.interests}
          />
        </TabsContent>

        <TabsContent value="files" className="space-y-4 mt-6">
          <DealFilesTab dealId={dealId} files={data.files} />
        </TabsContent>
      </Tabs>
    </>
  );
}

const DealDetailPage = async ({ params }: PageProps) => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/deals">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
      </div>

      <Suspense fallback={<DealDetailSkeleton />}>
        <FetchDealDetail params={params} />
      </Suspense>
    </div>
  );
};

export default DealDetailPage;

async function FetchDealDetail({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const [paramsData, sessionData] = await Promise.all([params, authSession()]);

  if (!sessionData?.user || sessionData.user.role !== "admin") {
    redirect("/login");
  }

  const { dealId } = paramsData;

  return <FetchDealDetailWrapper dealId={dealId} />;
}

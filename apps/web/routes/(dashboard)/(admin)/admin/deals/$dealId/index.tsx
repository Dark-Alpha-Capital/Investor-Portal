import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchAdminDealDetailData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Edit } from "lucide-react";
import { OverviewTab } from "@/components/deal-overview-tab";
import { DescriptionTab } from "@/components/deal-description-tab";
import { InvitesTab } from "@/components/deal-invites-tab";
import { InterestsTab } from "@/components/deal-interests-tab";
import { TabCounts } from "@/components/deal-tab-counts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { InvestmentsTab } from "@/components/deal-investments-tab";
import { DealFilesTab } from "@/components/deal-files-tab";
import type { AdminDealDetailPayload } from "@/lib/server-fns/admin-route-data";

export const Route = createFileRoute(
  "/(dashboard)/(admin)/admin/deals/$dealId/",
)({
  loader: async ({ params }: { params: { dealId: string } }) => {
    const r = await fetchAdminDealDetailData({
      data: { dealId: params.dealId },
    });
    if (r.tag === "not_found") {
      throw notFound();
    }
    return { dealId: params.dealId, data: r.payload };
  },
  component: AdminDealDetailRoutePage,
});

function AdminDealDetailRoutePage() {
  const { dealId, data } = Route.useLoaderData();
  return <AdminDealDetailInner dealId={dealId} data={data} />;
}

function AdminDealDetailInner({
  dealId,
  data,
}: {
  dealId: string;
  data: AdminDealDetailPayload;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/admin/deals">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex gap-2">
          <Link to={`/admin/deals/${dealId}/curate`}>
            <Button variant="secondary">
              <Users className="mr-2 h-4 w-4" />
              Curate
            </Button>
          </Link>
          <Link to={`/admin/deals/${dealId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Deal
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6 space-y-6">
        <TabCounts
          invitesCount={data.invites.length}
          interestsCount={data.interests.length}
          investmentsCount={data.investments.length}
          filesCount={data.files.length}
        />

        <TabsContent value="overview" className="mt-6 space-y-6">
          <OverviewTab deal={data.deal} />
        </TabsContent>

        <TabsContent value="description" className="mt-6 space-y-4">
          <DescriptionTab deal={data.deal} />
        </TabsContent>

        <TabsContent value="invites" className="mt-6 space-y-4">
          <InvitesTab invites={data.invites} />
        </TabsContent>

        <TabsContent value="interests" className="mt-6 space-y-4">
          <InterestsTab interests={data.interests} />
        </TabsContent>

        <TabsContent value="investments" className="mt-6 space-y-4">
          <InvestmentsTab
            dealId={dealId}
            investments={data.investments}
            interests={data.interests}
          />
        </TabsContent>

        <TabsContent value="files" className="mt-6 space-y-4">
          <DealFilesTab dealId={dealId} files={data.files} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

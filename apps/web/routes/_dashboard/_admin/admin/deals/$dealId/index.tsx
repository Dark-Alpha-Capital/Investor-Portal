import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchAdminDealDetailData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { OverviewTab } from "@/components/deal-overview-tab";
import { DescriptionTab } from "@/components/deal-description-tab";
import { InvitesTab } from "@/components/deal-invites-tab";
import { InterestsTab } from "@/components/deal-interests-tab";
import { TabCounts } from "@/components/deal-tab-counts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { InvestmentsTab } from "@/components/deal-investments-tab";
import { DealFilesTab } from "@/components/deal-files-tab";
import { DealQuestionsTab } from "@/components/deal-questions-tab";
import type { AdminDealDetailPayload } from "@/lib/server-fns/admin-route-data";
import { z } from "zod";

const searchSchema = z.object({
  tab: z
    .enum([
      "overview",
      "description",
      "invites",
      "interests",
      "investments",
      "files",
      "questions",
    ])
    .optional(),
});

type DealTab = NonNullable<z.infer<typeof searchSchema>["tab"]>;

export const Route = createFileRoute(
  "/_dashboard/_admin/admin/deals/$dealId/",
)({
  validateSearch: (search) => searchSchema.parse(search),
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
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AdminDealDetailInner
      dealId={dealId}
      data={data}
      activeTab={(tab ?? "overview") as DealTab}
      onTabChange={(value) =>
        void navigate({
          search: (current) => ({
            ...current,
            tab: value === "overview" ? undefined : (value as DealTab),
          }),
        })
      }
    />
  );
}

function AdminDealDetailInner({
  dealId,
  data,
  activeTab,
  onTabChange,
}: {
  dealId: string;
  data: AdminDealDetailPayload;
  activeTab: DealTab;
  onTabChange: (value: string) => void;
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
          <Link params={{ dealId }} to="/admin/deals/$dealId/edit">
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Deal
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="mt-6 space-y-6"
      >
        <TabCounts
          invitesCount={data.invites.length}
          interestsCount={data.interests.length}
          investmentsCount={data.investments.length}
          filesCount={data.files.length}
          questionsCount={data.openQuestionsCount}
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

        <TabsContent value="questions" className="mt-6 space-y-4">
          <DealQuestionsTab dealId={dealId} questions={data.questions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

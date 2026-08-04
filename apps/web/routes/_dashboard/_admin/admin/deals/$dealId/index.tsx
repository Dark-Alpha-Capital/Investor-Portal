import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchAdminDealDetailData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, MapPin, Orbit, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OverviewTab } from "@/components/deal-overview-tab";
import { DescriptionTab } from "@/components/deal-description-tab";
import { InvitesTab } from "@/components/deal-invites-tab";
import { InterestsTab } from "@/components/deal-interests-tab";
import { TabCounts } from "@/components/deal-tab-counts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { InvestmentsTab } from "@/components/deal-investments-tab";
import { DealFilesTab } from "@/components/deal-files-tab";
import { DealQuestionsTab } from "@/components/deal-questions-tab";
import { DealDeleteActions } from "@/components/deal-delete-actions";
import { DealStatusChip } from "@/components/deal-status-chip";
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
  validateSearch: (search) => {
    const parsed = searchSchema.safeParse(search);
    return parsed.success ? parsed.data : {};
  },
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

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function DealAdminHeader({
  deal,
  investmentsCount,
  isDeleted,
}: {
  deal: NonNullable<AdminDealDetailPayload["deal"]>;
  investmentsCount: number;
  isDeleted: boolean;
}) {
  const meta = [
    deal.dealType
      ? { icon: Layers, label: "Deal type", value: deal.dealType }
      : null,
    deal.sector
      ? { icon: Orbit, label: "Sector", value: deal.sector }
      : null,
    deal.geography
      ? { icon: MapPin, label: "Geography", value: deal.geography }
      : null,
  ].filter(
    (m): m is { icon: typeof Orbit; label: string; value: string } =>
      m !== null,
  );

  return (
    <header className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link to="/admin/deals">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All deals
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!isDeleted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  params={{ dealId: deal.id }}
                  to="/admin/deals/$dealId/edit"
                  aria-label="Edit deal"
                >
                  <Button size="icon" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Edit deal</TooltipContent>
            </Tooltip>
          ) : null}
          <DealDeleteActions
            dealId={deal.id}
            dealName={deal.name}
            isDeleted={isDeleted}
            investmentsCount={investmentsCount}
          />
        </div>
      </div>

      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {deal.name}
          </h1>
          <DealStatusChip status={deal.status} />
          {isDeleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Deleted
            </span>
          ) : null}
        </div>

        {deal.teaserSummary ? (
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {deal.teaserSummary}
          </p>
        ) : null}

        {meta.length > 0 ? (
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {meta.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {value}
                  </dd>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect width="18" height="18" x="3" y="4" rx="1" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Timeline
                </dt>
                <dd className="font-mono text-xs text-muted-foreground">
                  {formatDate(deal.launchDate)} →{" "}
                  {formatDate(deal.closeDate)}
                </dd>
              </div>
            </div>
          </dl>
        ) : null}
      </div>
    </header>
  );
}

function AdminDealDetailRoutePage() {
  const { dealId, data } = Route.useLoaderData();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const deal = data.deal;
  if (!deal) {
    throw notFound();
  }
  return (
    <AdminDealDetailInner
      dealId={dealId}
      data={data}
      deal={deal}
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
  deal,
  activeTab,
  onTabChange,
}: {
  dealId: string;
  data: AdminDealDetailPayload;
  deal: NonNullable<AdminDealDetailPayload["deal"]>;
  activeTab: DealTab;
  onTabChange: (value: string) => void;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <DealAdminHeader
        deal={deal}
        investmentsCount={data.investments.length}
        isDeleted={Boolean(deal.deletedAt)}
      />

      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="space-y-6"
      >
        <TabCounts
          invitesCount={data.invites.length}
          interestsCount={data.interests.length}
          investmentsCount={data.investments.length}
          filesCount={data.files.length}
          questionsCount={data.openQuestionsCount}
        />

        <TabsContent value="overview" className="mt-6 space-y-6">
          <OverviewTab deal={deal} />
        </TabsContent>

        <TabsContent value="description" className="mt-6 space-y-4">
          <DescriptionTab deal={deal} />
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
          <DealFilesTab dealId={dealId} entries={data.files} />
        </TabsContent>

        <TabsContent value="questions" className="mt-6 space-y-4">
          <DealQuestionsTab dealId={dealId} questions={data.questions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

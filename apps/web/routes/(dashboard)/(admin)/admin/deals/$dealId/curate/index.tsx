import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchAdminDealCurateData } from "@/lib/server-fns/admin-route-data";
import BackButton from "@/components/back-button";
import { DealCurationTabs } from "@/components/deal-curation-tabs";

type Investors = Awaited<
  ReturnType<typeof import("@repo/db/queries").getInvestorsForCuration>
>;
type Invites = Awaited<
  ReturnType<typeof import("@repo/db/queries").getDealInvitesForCuration>
>;

export const Route = createFileRoute(
  "/(dashboard)/(admin)/admin/deals/$dealId/curate/",
)({
  loader: async ({ params }: { params: { dealId: string } }) => {
    const r = await fetchAdminDealCurateData({
      data: { dealId: params.dealId },
    });
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return {
      dealId: params.dealId,
      investors: r.investors,
      invites: r.invites,
    };
  },
  component: AdminDealCurateRoutePage,
});

function AdminDealCurateRoutePage() {
  const { dealId, investors, invites } = Route.useLoaderData();
  return (
    <AdminDealCurateInner
      dealId={dealId}
      investors={investors}
      invites={invites}
    />
  );
}

function AdminDealCurateInner({
  dealId,
  investors,
  invites,
}: {
  dealId: string;
  investors: Investors;
  invites: Invites;
}) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 mt-6 flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curate Deal</h1>
          <p className="mt-2 text-muted-foreground">
            Select which investors can see this deal
          </p>
        </div>
      </div>

      <DealCurationTabs dealId={dealId} investors={investors} invites={invites} />
    </div>
  );
}

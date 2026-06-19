import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchAdminDealsListData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealsTable } from "@/components/deals-table";
import { serializeRouteSearch } from "@/lib/serialize-route-search";

type AdminDealsPayload = Awaited<
  ReturnType<typeof import("@repo/db/queries").getAdminDeals>
>;

export const Route = createFileRoute("/(dashboard)/(admin)/admin/deals/")({
  loader: async ({ location }) => {
    const r = await fetchAdminDealsListData({
      data: { search: serializeRouteSearch(location.search) },
    });
    return { initialData: r.initialData };
  },
  component: AdminDealsRoutePage,
});

function AdminDealsRoutePage() {
  const { initialData } = Route.useLoaderData();
  return <AdminDealsInner initialData={initialData} />;
}

function AdminDealsInner({
  initialData,
}: {
  initialData: AdminDealsPayload;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals Management</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage investment deals
          </p>
        </div>
        <Link to="/admin/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      <DealsTable initialData={initialData} />
    </div>
  );
}

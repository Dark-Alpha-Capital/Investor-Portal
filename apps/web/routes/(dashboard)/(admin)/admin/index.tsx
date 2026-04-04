import { createFileRoute } from "@tanstack/react-router";
import { fetchAdminHomePageData } from "@/lib/server-fns/admin-route-data";
import { AdminDashboardTabs } from "@/components/admin-dashboard-tabs";
import type { AdminHomeOk } from "@/lib/server-fns/admin-route-data";

export const Route = createFileRoute("/(dashboard)/(admin)/admin/")({
  loader: async ({ location }: { location: { search: string } }) => {
    const r = await fetchAdminHomePageData({
      data: { search: location.search },
    });
    return { dashboard: r.dashboard };
  },
  component: AdminDashboardRoutePage,
});

function AdminDashboardRoutePage() {
  const { dashboard } = Route.useLoaderData();
  return <AdminDashboardInner dashboard={dashboard} />;
}

function AdminDashboardInner({
  dashboard,
}: {
  dashboard: AdminHomeOk["dashboard"];
}) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage users and monitor system activity
        </p>
      </div>

      <AdminDashboardTabs dashboard={dashboard} />
    </div>
  );
}

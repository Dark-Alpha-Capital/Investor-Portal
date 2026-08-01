import { AdminsTableClient } from "@/components/admin-admins-table-client";
import type { AdminHomeOk } from "@/lib/server-fns/admin-route-data";

type DashboardData = AdminHomeOk["dashboard"];

export function AdminDashboardTabs({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Administrators</h2>
        <p className="text-sm text-muted-foreground">
          Manage portal administrators. Investor KYC and invitations live under
          Compliance.
        </p>
      </div>
      <AdminsTableClient initialData={dashboard.admins} />
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorsTableClient } from "@/components/admin-investors-table-client";
import { AdminsTableClient } from "@/components/admin-admins-table-client";
import type { AdminHomeOk } from "@/lib/server-fns/admin-route-data";

type DashboardData = AdminHomeOk["dashboard"];

export function AdminDashboardTabs({ dashboard }: { dashboard: DashboardData }) {
  return (
    <Tabs defaultValue="investors" className="w-full">
      <TabsList>
        <TabsTrigger value="investors">Investors</TabsTrigger>
        <TabsTrigger value="admins">Administrators</TabsTrigger>
      </TabsList>

      <TabsContent value="investors" className="mt-6">
        <InvestorsTableClient initialData={dashboard.investors} />
      </TabsContent>

      <TabsContent value="admins" className="mt-6">
        <AdminsTableClient initialData={dashboard.admins} />
      </TabsContent>
    </Tabs>
  );
}

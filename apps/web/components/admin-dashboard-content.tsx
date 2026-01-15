import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { caller } from "@/trpc/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorsTableClient } from "./admin-investors-table-client";
import { AdminsTableClient } from "./admin-admins-table-client";

type SearchParams = Promise<{
  // Investors params
  investorsPage?: string;
  investorsSearch?: string;
  investorsKycStatus?: string;
  investorsVerified?: string;
  // Admins params
  adminsPage?: string;
  adminsSearch?: string;
  adminsVerified?: string;
  adminsStatus?: string;
}>;

type AdminDashboardContentProps = {
  searchParams: SearchParams;
};

export async function AdminDashboardContent({
  searchParams,
}: AdminDashboardContentProps) {
  // Auth is handled in the layout - no need to check here
  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const investorsPage = parseInt(params.investorsPage || "1", 10);
  const investorsSearch = params.investorsSearch || undefined;
  const investorsKycStatus =
    params.investorsKycStatus && params.investorsKycStatus !== "all"
      ? params.investorsKycStatus
      : undefined;
  const investorsVerified =
    params.investorsVerified && params.investorsVerified !== "all"
      ? params.investorsVerified
      : undefined;

  const adminsPage = parseInt(params.adminsPage || "1", 10);
  const adminsSearch = params.adminsSearch || undefined;
  const adminsVerified =
    params.adminsVerified && params.adminsVerified !== "all"
      ? params.adminsVerified
      : undefined;
  const adminsStatus =
    params.adminsStatus && params.adminsStatus !== "all"
      ? params.adminsStatus
      : undefined;

  // Return the data fetching component directly - Suspense is handled by the page component
  return (
    <FetchAdminDashboardWrapper
      investorsPage={investorsPage}
      investorsLimit={12}
      investorsSearch={investorsSearch}
      investorsKycStatus={investorsKycStatus}
      investorsVerified={investorsVerified}
      adminsPage={adminsPage}
      adminsLimit={12}
      adminsSearch={adminsSearch}
      adminsVerified={adminsVerified}
      adminsStatus={adminsStatus}
    />
  );
}

async function FetchAdminDashboardWrapper({
  investorsPage,
  investorsLimit,
  investorsSearch,
  investorsKycStatus,
  investorsVerified,
  adminsPage,
  adminsLimit,
  adminsSearch,
  adminsVerified,
  adminsStatus,
}: {
  investorsPage: number;
  investorsLimit: number;
  investorsSearch?: string;
  investorsKycStatus?: string;
  investorsVerified?: string;
  adminsPage: number;
  adminsLimit: number;
  adminsSearch?: string;
  adminsVerified?: string;
  adminsStatus?: string;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-dashboard");

  const data = await caller.admin.getAdminDashboard({
    investorsPage,
    investorsLimit,
    investorsSearch,
    investorsKycStatus,
    investorsVerified,
    adminsPage,
    adminsLimit,
    adminsSearch,
    adminsVerified,
    adminsStatus,
  });

  return (
    <Tabs defaultValue="investors" className="w-full">
      <TabsList>
        <TabsTrigger value="investors">Investors</TabsTrigger>
        <TabsTrigger value="admins">Administrators</TabsTrigger>
      </TabsList>

      <TabsContent value="investors" className="mt-6">
        <InvestorsTableClient initialData={data.investors} />
      </TabsContent>

      <TabsContent value="admins" className="mt-6">
        <AdminsTableClient initialData={data.admins} />
      </TabsContent>
    </Tabs>
  );
}

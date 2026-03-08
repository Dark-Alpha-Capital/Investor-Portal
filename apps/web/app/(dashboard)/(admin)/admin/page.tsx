import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { caller } from "@/trpc/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorsTableSkeleton } from "@/components/skeleton/investors-table-skeleton";
import { InvestorsTableClient } from "@/components/admin-investors-table-client";
import { AdminsTableClient } from "@/components/admin-admins-table-client";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";

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

/**
 * Admin Dashboard Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Header with title (prerendered)
 * - Dynamic content: AdminDashboardContent wrapped in Suspense (streamed at request time)
 *
 * Auth is handled in the layout at apps/web/app/(dashboard)/(admin)/layout.tsx
 *
 * The AdminDashboardContent component:
 * - Handles runtime data (searchParams, session)
 * - Fetches both investors and admins data in parallel using a single tRPC endpoint
 * - Renders tabs with data passed to client table components
 */
export default function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users and monitor system activity
        </p>
      </div>

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<InvestorsTableSkeleton />}>
        <AdminDashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminDashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const userSession = await authSession();
  if (!userSession) {
    redirect("/login");
  }

  if (userSession.user.role !== "admin") {
    redirect("/dashboard");
  }

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

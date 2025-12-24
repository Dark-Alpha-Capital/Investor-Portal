import React, { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { InvestorsTable } from "./components/investors-table";
import { AdminsTable } from "./components/admins-table";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

const LoadingState = () => (
  <div className="py-12">
    <div className="flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  </div>
);

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

const AdminPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin (by role or email domain as fallback)
  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Get search params for prefetching
  const params = await searchParams;

  // Investors query params
  const investorsPage = parseInt(params.investorsPage || "1", 10);
  const investorsSearch = params.investorsSearch || undefined;
  const investorsKycStatus = params.investorsKycStatus && params.investorsKycStatus !== "all"
    ? params.investorsKycStatus
    : undefined;
  const investorsVerified = params.investorsVerified && params.investorsVerified !== "all"
    ? params.investorsVerified
    : undefined;

  // Admins query params
  const adminsPage = parseInt(params.adminsPage || "1", 10);
  const adminsSearch = params.adminsSearch || undefined;
  const adminsVerified = params.adminsVerified && params.adminsVerified !== "all"
    ? params.adminsVerified
    : undefined;
  const adminsStatus = params.adminsStatus && params.adminsStatus !== "all"
    ? params.adminsStatus
    : undefined;

  // Prefetch both queries on the server
  prefetch(
    trpc.admin.getInvestors.queryOptions({
      page: investorsPage,
      limit: 12,
      search: investorsSearch,
      kycStatus: investorsKycStatus,
      verified: investorsVerified,
    })
  );

  prefetch(
    trpc.admin.getAdmins.queryOptions({
      page: adminsPage,
      limit: 12,
      search: adminsSearch,
      verified: adminsVerified,
      status: adminsStatus,
    })
  );

  return (
    <HydrateClient>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and monitor system activity
          </p>
        </div>

        <Tabs defaultValue="investors" className="w-full">
          <TabsList>
            <TabsTrigger value="investors">Investors</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>

          <TabsContent value="investors" className="mt-6">
            <Suspense fallback={<LoadingState />}>
              <InvestorsTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="admins" className="mt-6">
            <Suspense fallback={<LoadingState />}>
              <AdminsTable />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </HydrateClient>
  );
};

export default AdminPage;

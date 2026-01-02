import "server-only";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { ComplianceTableClient } from "./compliance-table-client";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  clearanceStatus?: string;
}>;

type ComplianceDashboardContentProps = {
  searchParams: SearchParams;
};

export async function ComplianceDashboardContent({
  searchParams,
}: ComplianceDashboardContentProps) {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || undefined;
  const clearanceStatus =
    params.clearanceStatus && params.clearanceStatus !== "all"
      ? params.clearanceStatus
      : undefined;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading compliance data...
          </div>
        </div>
      }
    >
      <FetchComplianceWrapper
        page={page}
        limit={12}
        search={search}
        clearanceStatus={clearanceStatus}
      />
    </Suspense>
  );
}

async function FetchComplianceWrapper({
  page,
  limit,
  search,
  clearanceStatus,
}: {
  page: number;
  limit: number;
  search?: string;
  clearanceStatus?: string;
}) {
  // Fetch investors data
  const data = await caller.compliance.getPendingInvestors({
    page,
    limit,
    search,
    clearanceStatus,
  });

  return (
    <ComplianceTableClient
      initialData={data}
      initialPage={page}
      initialClearanceStatus={clearanceStatus || "all"}
    />
  );
}

import "server-only";
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
  // Auth is handled in the layout - no need to check here
  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || undefined;
  const clearanceStatus =
    params.clearanceStatus && params.clearanceStatus !== "all"
      ? params.clearanceStatus
      : undefined;

  // Return the data fetching component directly - Suspense is handled by the page component
  return (
    <FetchComplianceWrapper
      page={page}
      limit={12}
      search={search}
      clearanceStatus={clearanceStatus}
    />
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

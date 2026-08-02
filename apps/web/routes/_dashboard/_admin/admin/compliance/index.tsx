import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Info, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ComplianceTableClient } from "@/components/compliance-table-client";
import {
  complianceListSearchSchema,
  loadComplianceList,
  type ComplianceListData,
  type ComplianceListSearch,
} from "@/lib/loaders/compliance";

function parseComplianceSearch(
  search: Record<string, unknown>,
): ComplianceListSearch {
  return complianceListSearchSchema.parse(search);
}

function normalizeComplianceDeps(search: ComplianceListSearch) {
  return {
    page: search.page ?? 1,
    search: search.search?.trim() || undefined,
    clearanceStatus:
      search.clearanceStatus && search.clearanceStatus !== "all"
        ? search.clearanceStatus
        : undefined,
  };
}

function complianceListQueryOptions(deps: ComplianceListSearch) {
  return queryOptions({
    queryKey: ["compliance", "list", normalizeComplianceDeps(deps)],
    queryFn: async (): Promise<ComplianceListData> =>
      loadComplianceList({ data: deps }),
    placeholderData: keepPreviousData,
  });
}

export const Route = createFileRoute("/_dashboard/_admin/admin/compliance/")({
  validateSearch: parseComplianceSearch,
  loader: async ({ context: { queryClient }, location }) => {
    const search = parseComplianceSearch(
      location.search as Record<string, unknown>,
    );
    await queryClient.ensureQueryData(complianceListQueryOptions(search));
  },
  component: ComplianceListRoutePage,
});

function ComplianceListRoutePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading, isFetching }: UseQueryResult<ComplianceListData> =
    useQuery(complianceListQueryOptions(search));

  if (isLoading && !data) {
    return (
      <div className="container mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance & Clearance
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review investor KYC submissions, set global status, and invite
          investors to deals
        </p>
      </div>

      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <Info className="h-4 w-4 !text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">
          KYC-Gated Deal Marketplace
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <div className="mt-2 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Pending / No Clearance</p>
                <p className="text-xs opacity-80">
                  Investor cannot see any deals in the marketplace
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Cleared</p>
                <p className="text-xs opacity-80">
                  Permissions auto-granted for all non-draft deals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Per-Deal Permissions</p>
                <p className="text-xs opacity-80">
                  Manage specific access via investor detail page
                </p>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <ComplianceTableClient
        data={data}
        search={search.search ?? ""}
        clearanceStatus={search.clearanceStatus ?? "all"}
        isFetching={isFetching}
        onSearchChange={(value) => {
          void navigate({
            search: (current) => ({
              ...current,
              search: value.trim() ? value : undefined,
              page: 1,
            }),
          });
        }}
        onClearanceStatusChange={(value) => {
          void navigate({
            search: (current) => ({
              ...current,
              clearanceStatus: value === "all" ? undefined : value,
              page: 1,
            }),
          });
        }}
        onPageChange={(page) => {
          void navigate({
            search: (current) => ({
              ...current,
              page,
            }),
          });
        }}
      />
    </div>
  );
}

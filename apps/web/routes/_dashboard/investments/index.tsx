import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search, X, PieChart, DollarSign, TrendingUp, Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";
import { INVESTMENT_STATUS_LABELS } from "@repo/db/investment-closing";
import {
  loadMyInvestments,
  myInvestmentsSearchSchema,
  normalizeMyInvestmentsDeps,
  type MyInvestmentsData,
  type MyInvestmentsSearch,
} from "@/lib/loaders/my-investments";
import { myInvestmentsQueryKey } from "@/lib/types/investor-route-loaders";
import { MyInvestmentsTable } from "./components/my-investments-table";

function parseMyInvestmentsSearch(
  search: Record<string, unknown>,
): MyInvestmentsSearch {
  return myInvestmentsSearchSchema.parse(search);
}

function myInvestmentsQueryOptions(deps: MyInvestmentsSearch) {
  return queryOptions({
    queryKey: myInvestmentsQueryKey(normalizeMyInvestmentsDeps(deps)),
    queryFn: async (): Promise<MyInvestmentsData> =>
      loadMyInvestments({ data: deps }),
    placeholderData: keepPreviousData,
  });
}

export const Route = createFileRoute("/_dashboard/investments/")({
  validateSearch: parseMyInvestmentsSearch,
  loader: async ({ context: { queryClient }, location }) => {
    const search = parseMyInvestmentsSearch(
      location.search as Record<string, unknown>,
    );
    await queryClient.ensureQueryData(myInvestmentsQueryOptions(search));
  },
  component: MyInvestmentsRoutePage,
});

function InvestmentsSearchField({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const debouncedChange = useDebouncedCallback((next: string) => {
    onValueChange(next);
  }, 300);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={draft ? "pl-9 pr-9" : "pl-9"}
        placeholder="Search investments..."
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          debouncedChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {draft ? (
        <Button
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={() => {
            setDraft("");
            debouncedChange.cancel();
            onValueChange("");
          }}
          variant="ghost"
          size="icon"
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      ) : null}
    </div>
  );
}

function getPageNumbers(current: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);
  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < totalPages - 2) {
    pages.push("ellipsis");
  }
  pages.push(totalPages);

  return pages;
}

function MyInvestmentsRoutePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading, isFetching }: UseQueryResult<MyInvestmentsData> =
    useQuery(myInvestmentsQueryOptions(search));

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const status = search.status ?? "all";
  const currentPage = search.page ?? 1;
  const investments = data.investments;
  const pagination = data.pagination;
  const summary = data.summary;
  const hasActiveFilters = Boolean(
    search.search?.trim() || status !== "all",
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            My Investments
          </h1>
          <p className="text-muted-foreground text-base">
            Your current commitments and where your capital is deployed
          </p>
        </div>

        <section
          className="mb-10 border-y border-border py-2"
          aria-label="Portfolio metrics"
        >
          <dl className="grid gap-0 md:grid-cols-4 md:divide-x md:divide-border">
            <div className="space-y-2 py-5 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Capital Committed
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(summary.capitalCommitted)}
              </dd>
            </div>

            <div className="space-y-2 border-t border-border py-5 md:border-t-0 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Capital Deployed
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(summary.capitalDeployed)}
              </dd>
            </div>

            <div className="space-y-2 border-t border-border py-5 md:border-t-0 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Current Value
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(summary.currentValue)}
              </dd>
            </div>

            <div className="space-y-2 border-t border-border py-5 md:border-t-0 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PieChart className="h-4 w-4" />
                Distributions
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(summary.distributions)}
              </dd>
            </div>
          </dl>
          <p className="px-0 pb-4 text-xs text-muted-foreground md:px-6">
            Across {summary.totalInvestments}{" "}
            {summary.totalInvestments === 1 ? "investment" : "investments"}
          </p>
        </section>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <InvestmentsSearchField
                value={search.search ?? ""}
                onValueChange={(value) => {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      search: value.trim() ? value : undefined,
                      page: 1,
                    }),
                  });
                }}
              />

              <Select
                value={status}
                onValueChange={(value) => {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      status: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Current</SelectItem>
                  {Object.entries(INVESTMENT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              <span className="text-foreground">{pagination.totalCount}</span>{" "}
              {pagination.totalCount === 1 ? "investment" : "investments"} found
              {pagination.totalPages > 1 ? (
                <span className="ml-2 text-xs">
                  (page {currentPage} of {pagination.totalPages})
                </span>
              ) : null}
            </p>
          </div>

          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-y border-border py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <PieChart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No investments found</h3>
              <p className="mb-1 max-w-sm text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No investments match your current filters."
                  : "You don't have any current investments yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your search or status filter."
                  : "Explore the marketplace to make your first commitment."}
              </p>
            </div>
          ) : (
            <>
              <MyInvestmentsTable investments={investments} />

              {pagination.totalPages > 1 ? (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!pagination.hasPrevPage) return;
                          void navigate({
                            search: (current) => ({
                              ...current,
                              page: currentPage - 1,
                            }),
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={
                          !pagination.hasPrevPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers(currentPage, pagination.totalPages).map(
                      (page, index) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                void navigate({
                                  search: (current) => ({
                                    ...current,
                                    page: page === 1 ? undefined : page,
                                  }),
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!pagination.hasNextPage) return;
                          void navigate({
                            search: (current) => ({
                              ...current,
                              page: currentPage + 1,
                            }),
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={
                          !pagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

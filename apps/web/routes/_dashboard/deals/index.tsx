import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
import { Briefcase, Search, X } from "lucide-react";
import {
  loadMarketplaceDeals,
  marketplaceDealsSearchSchema,
  normalizeMarketplaceDealsDeps,
  type MarketplaceDealsData,
  type MarketplaceDealsSearch,
} from "@/lib/loaders/marketplace-deals";
import { marketplaceDealsQueryKey } from "@/lib/types/investor-route-loaders";
import { DealsTableView } from "./components/deals-table-view";

function parseMarketplaceSearch(
  search: Record<string, unknown>,
): MarketplaceDealsSearch {
  return marketplaceDealsSearchSchema.parse(search);
}

function marketplaceDealsQueryOptions(deps: MarketplaceDealsSearch) {
  return queryOptions({
    queryKey: marketplaceDealsQueryKey(normalizeMarketplaceDealsDeps(deps)),
    queryFn: async (): Promise<MarketplaceDealsData> =>
      loadMarketplaceDeals({ data: deps }),
    placeholderData: keepPreviousData,
  });
}

export const Route = createFileRoute("/_dashboard/deals/")({
  validateSearch: parseMarketplaceSearch,
  loader: async ({ context: { queryClient }, location }) => {
    const search = parseMarketplaceSearch(
      location.search as Record<string, unknown>,
    );
    await queryClient.ensureQueryData(marketplaceDealsQueryOptions(search));
  },
  component: DealsRoutePage,
});

function MarketplaceSearchField({
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
        placeholder="Search deals..."
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

function DealsRoutePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading, isFetching }: UseQueryResult<MarketplaceDealsData> =
    useQuery(marketplaceDealsQueryOptions(search));

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

  const sector = search.sector ?? "all";
  const geography = search.geography ?? "all";
  const dealType = search.dealType ?? "all";
  const currentPage = search.page ?? 1;
  const deals = data.deals;
  const pagination = data.pagination;
  const availableSectors = data.filters.sectors;
  const availableGeographies = data.filters.geographies;
  const availableDealTypes = data.filters.dealTypes;
  const hasActiveFilters = Boolean(
    search.search?.trim() ||
      (sector !== "all") ||
      (geography !== "all") ||
      (dealType !== "all"),
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            Available Investments
          </h1>
          <p className="text-muted-foreground text-base">
            Discover investment opportunities tailored to your profile
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <MarketplaceSearchField
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
                value={sector}
                onValueChange={(value) => {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      sector: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {availableSectors.map((s) => (
                    <SelectItem key={s} value={s.toLowerCase()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={geography}
                onValueChange={(value) => {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      geography: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Geography" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Geographies</SelectItem>
                  {availableGeographies.map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={dealType}
                onValueChange={(value) => {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      dealType: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Deal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deal Types</SelectItem>
                  {availableDealTypes.map((t) => (
                    <SelectItem key={t} value={t.toLowerCase()}>
                      {t}
                    </SelectItem>
                  ))}
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
              {pagination.totalCount === 1 ? "deal" : "deals"} found
              {pagination.totalPages > 1 ? (
                <span className="ml-2 text-xs">
                  (page {currentPage} of {pagination.totalPages})
                </span>
              ) : null}
            </p>
          </div>

          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-y border-border py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No live deals</h3>
              <p className="mb-1 text-sm text-muted-foreground max-w-sm">
                {hasActiveFilters
                  ? "No live deals match your current filters."
                  : "You have no invitations to live deals right now."}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "When you are invited to a live opportunity, it will appear here."}
              </p>
            </div>
          ) : (
            <>
              <DealsTableView deals={deals} />

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

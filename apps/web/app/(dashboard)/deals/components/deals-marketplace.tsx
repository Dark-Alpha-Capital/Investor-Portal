"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { SearchInput } from "@/components/search-input";
import { DealsTableView } from "./deals-table-view";
import { DealsCardView } from "./deals-card-view";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "live", label: "Live" },
  { value: "closing", label: "Closing" },
  { value: "funded", label: "Funded" },
  { value: "exited", label: "Exited" },
];

const ITEMS_PER_PAGE = 12;

export function DealsMarketplace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  // Get filter values from URL params
  const view = searchParams.get("view") || "card";
  const status = searchParams.get("status") || "all";
  const sector = searchParams.get("sector") || "all";
  const searchParam = searchParams.get("search") || "";
  const pageParam = searchParams.get("page") || "1";
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  // Update URL params helper
  const updateParams = useCallback(
    (updates: Record<string, string>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "" && value !== "1") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Reset to page 1 when filters change
      if (resetPage) {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Query for paginated deals with caching
  const { data, isLoading, isFetching, isError, error } = useQuery({
    ...trpc.deals.getMarketplaceDeals.queryOptions({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchParam || undefined,
      status: status !== "all" ? status : undefined,
      sector: sector !== "all" ? sector : undefined,
    }),
    // Cache settings for deals marketplace
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch if data exists in cache
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching new
  });

  const deals = data?.deals ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const availableSectors = data?.filters?.sectors ?? [];

  // Handle page change
  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const { totalPages } = pagination;
    const current = currentPage;

    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Build page URL
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <SearchInput
            paramKey="search"
            placeholder="Search deals..."
            onResetPage={true}
          />

          {/* Status Filter */}
          <Select
            value={status}
            onValueChange={(value) => updateParams({ status: value }, true)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sector Filter */}
          <Select
            value={sector}
            onValueChange={(value) => updateParams({ sector: value }, true)}
          >
            <SelectTrigger className="w-[140px]">
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
        </div>

        {/* View Toggle */}
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value) updateParams({ view: value });
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="card" aria-label="Card view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              {pagination.totalCount} deal
              {pagination.totalCount !== 1 ? "s" : ""} found
              {pagination.totalPages > 1 && (
                <span className="ml-1">
                  (page {currentPage} of {pagination.totalPages})
                </span>
              )}
            </>
          )}
        </p>
        {/* Background fetch indicator */}
        {isFetching && !isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="py-12 text-center">
          <p className="text-destructive">
            Failed to load deals: {error?.message || "Unknown error"}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && deals.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No deals match your filters.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Deals Display */}
      {!isLoading && !isError && deals.length > 0 && (
        <>
          {view === "table" ? (
            <DealsTableView deals={deals} />
          ) : (
            <DealsCardView deals={deals} />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={
                      pagination.hasPrevPage
                        ? getPageUrl(currentPage - 1)
                        : undefined
                    }
                    onClick={(e) => {
                      if (!pagination.hasPrevPage) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={
                      !pagination.hasPrevPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={getPageUrl(page)}
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href={
                      pagination.hasNextPage
                        ? getPageUrl(currentPage + 1)
                        : undefined
                    }
                    onClick={(e) => {
                      if (!pagination.hasNextPage) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
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
          )}
        </>
      )}
    </div>
  );
}

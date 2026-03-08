"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useTransition } from "react";
import { Loader2, Briefcase } from "lucide-react";
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
import { SearchInput } from "@/components/search-input";
import { DealsTableView } from "./deals-table-view";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "live", label: "Live" },
  { value: "closing", label: "Closing" },
  { value: "funded", label: "Funded" },
  { value: "exited", label: "Exited" },
];

const ITEMS_PER_PAGE = 12;

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  curationNote?: string | null;
  isCurated?: boolean;
};

type DealsMarketplaceProps = {
  initialData: {
    success: boolean;
    deals: Deal[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      sectors: string[];
    };
    clearanceStatus?: string | null;
  };
};

export function DealsMarketplace({ initialData }: DealsMarketplaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get filter values from URL params
  const status = searchParams.get("status") || "all";
  const sector = searchParams.get("sector") || "all";
  const searchParam = searchParams.get("search") || "";
  const pageParam = searchParams.get("page") || "1";
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  useEffect(() => {
    if (!searchParams.has("view")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Update URL params helper - wrapped in transition to show pending state
  const updateParams = useCallback(
    (updates: Record<string, string>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (key === "view") {
          params.delete("view");
          return;
        }
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
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router, startTransition],
  );

  // Use server-fetched cached data directly
  const deals = initialData?.deals ?? [];
  const pagination = initialData?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const availableSectors = initialData?.filters?.sectors ?? [];

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
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1 sm:max-w-md">
            <SearchInput
              paramKey="search"
              placeholder="Search deals..."
              onResetPage={true}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={status}
            onValueChange={(value) => updateParams({ status: value }, true)}
          >
            <SelectTrigger className="w-full sm:w-40">
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
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {availableSectors.map((s: string) => (
                <SelectItem key={s} value={s.toLowerCase()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          <span className="text-foreground">{pagination.totalCount}</span>{" "}
          {pagination.totalCount === 1 ? "deal" : "deals"} found
          {pagination.totalPages > 1 && (
            <span className="ml-2 text-xs">
              (page {currentPage} of {pagination.totalPages})
            </span>
          )}
        </p>
      </div>

      {/* Empty State */}
      {deals.length === 0 && (
        <div className="flex flex-col items-center justify-center border-y border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No deals found</h3>
          <p className="mb-1 text-sm text-muted-foreground max-w-sm">
            No deals match your current filters.
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}

      {/* Deals Display */}
      {deals.length > 0 && (
        <>
          <DealsTableView deals={deals} />

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
                  ),
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

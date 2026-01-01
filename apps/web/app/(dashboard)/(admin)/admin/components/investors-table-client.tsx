"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import type { InvestorsData } from "../lib/get-investors-cached";
import { LayoutGrid, List, CheckCircle2, XCircle, Ban, Eye, Loader2 } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type Investor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  createdAt: string | null;
  kycStatus: string | null;
};

const KYC_STATUSES = [
  { value: "all", label: "All KYC Status" },
  { value: "review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "pending_docs", label: "Pending Documents" },
  { value: "rejected", label: "Rejected" },
];

const VERIFIED_STATUSES = [
  { value: "all", label: "All Verified" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

const ITEMS_PER_PAGE = 12;

const getKycStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    pending_docs: { variant: "outline", label: "Pending Documents" },
    rejected: { variant: "destructive", label: "Rejected" },
  };

  const config = statusConfig[status || "review"] || statusConfig.review;
  return (
    <Badge variant={config?.variant || "secondary"}>
      {config?.label || "Under Review"}
    </Badge>
  );
};

const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Table View Component
function InvestorsTableView({
  investors,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  investors: Investor[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const allSelected = investors.length > 0 && selectedIds.size === investors.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < investors.length;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                }
              }}
              onCheckedChange={onToggleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>KYC Status</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {investors.map((investor) => (
          <TableRow key={investor.id} className="group">
            <TableCell>
              <Checkbox
                checked={selectedIds.has(investor.id)}
                onCheckedChange={() => onToggleSelect(investor.id)}
                aria-label={`Select ${investor.name || investor.email}`}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={investor.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(investor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{investor.name || "N/A"}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{investor.email}</span>
            </TableCell>
            <TableCell>
              {investor.banned ? (
                <Badge variant="destructive">
                  <Ban className="mr-1 h-3 w-3" />
                  Banned
                </Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
            </TableCell>
            <TableCell>{getKycStatusBadge(investor.kycStatus)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {investor.emailVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Unverified</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDate(investor.createdAt)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/admin/users/${investor.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Card View Component
function InvestorsCardView({
  investors,
  selectedIds,
  onToggleSelect,
}: {
  investors: Investor[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {investors.map((investor) => (
        <div
          key={investor.id}
          className="group border border-border rounded-lg p-4 space-y-4 transition-colors hover:border-primary/50"
        >
          {/* Header with checkbox and avatar */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.has(investor.id)}
                onCheckedChange={() => onToggleSelect(investor.id)}
                aria-label={`Select ${investor.name || investor.email}`}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={investor.image || undefined} />
                <AvatarFallback>{getInitials(investor.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{investor.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {investor.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {investor.banned ? (
              <Badge variant="destructive">
                <Ban className="mr-1 h-3 w-3" />
                Banned
              </Badge>
            ) : (
              <Badge variant="outline">Active</Badge>
            )}
            {getKycStatusBadge(investor.kycStatus)}
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email Verified</span>
              <div className="flex items-center gap-1">
                {investor.emailVerified ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary">Yes</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">No</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(investor.createdAt)}</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 border-t border-border">
            <Link href={`/admin/users/${investor.id}`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

type InvestorsTableClientProps = {
  initialData?: InvestorsData;
};

export function InvestorsTableClient({ initialData }: InvestorsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get filter values from URL params
  const view = searchParams.get("investorsView") || "table";
  const kycStatus = searchParams.get("investorsKyc") || "all";
  const verified = searchParams.get("investorsVerified") || "all";
  const searchParam = searchParams.get("investorsSearch") || "";
  const pageParam = searchParams.get("investorsPage") || "1";
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  // Update URL params helper - wrapped in transition to show pending state
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
        params.delete("investorsPage");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router, startTransition]
  );

  // Use server-fetched cached data directly
  const investors = initialData?.investors ?? [];
  const pagination = initialData?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateParams({ investorsPage: page.toString() });
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === investors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(investors.map((i) => i.id)));
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const { totalPages } = pagination;
    const current = currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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
    }

    return pages;
  };

  // Build page URL
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("investorsPage", page.toString());
    } else {
      params.delete("investorsPage");
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
            paramKey="investorsSearch"
            placeholder="Search investors..."
            onResetPage={true}
          />

          {/* KYC Status Filter */}
          <Select
            value={kycStatus}
            onValueChange={(value) => updateParams({ investorsKyc: value }, true)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="KYC Status" />
            </SelectTrigger>
            <SelectContent>
              {KYC_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Verified Filter */}
          <Select
            value={verified}
            onValueChange={(value) => updateParams({ investorsVerified: value }, true)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              {VERIFIED_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
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
            if (value) updateParams({ investorsView: value });
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Card view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Results count and selection info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.totalCount} investor{pagination.totalCount !== 1 ? "s" : ""} found
          {pagination.totalPages > 1 && (
            <span className="ml-1">
              (page {currentPage} of {pagination.totalPages})
            </span>
          )}
          {selectedIds.size > 0 && (
            <span className="ml-2">({selectedIds.size} selected)</span>
          )}
        </p>
        {/* Background fetch indicator */}
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Empty State */}
      {investors.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No investors match your filters.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Content */}
      {investors.length > 0 && (
        <>
          {view === "table" ? (
            <InvestorsTableView
              investors={investors}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ) : (
            <InvestorsCardView
              investors={investors}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pagination.hasPrevPage ? getPageUrl(currentPage - 1) : undefined}
                    onClick={(e) => {
                      if (!pagination.hasPrevPage) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                    href={pagination.hasNextPage ? getPageUrl(currentPage + 1) : undefined}
                    onClick={(e) => {
                      if (!pagination.hasNextPage) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

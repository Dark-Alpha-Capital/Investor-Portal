"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  Search,
  Edit,
  Eye,
  Trash2,
  Users,
  Plus,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useClientSession } from "@/lib/get-client-session";

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
};

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "live", label: "Live" },
  { value: "closing", label: "Closing" },
  { value: "funded", label: "Funded" },
  { value: "exited", label: "Exited" },
  { value: "cancelled", label: "Cancelled" },
];

const VISIBILITIES = [
  { value: "all", label: "All Visibility" },
  { value: "public", label: "Public" },
  { value: "accredited", label: "Accredited" },
  { value: "invite_only", label: "Invite Only" },
];

const statusColors: Record<string, string> = {
  draft: "secondary",
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

const visibilityColors: Record<string, string> = {
  public: "default",
  accredited: "default",
  invite_only: "secondary",
};

const formatCurrency = (value: string | null) => {
  if (value === null || value === undefined) return "-";
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "-";
  if (numValue >= 1000000) {
    return `$${(numValue / 1000000).toFixed(1)}M`;
  }
  if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(0)}K`;
  }
  return `$${numValue.toLocaleString()}`;
};

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Table View Component
function DealsTableView({
  deals,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAdmin,
  onDeleteClick,
  startIndex,
}: {
  deals: Deal[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAdmin: boolean;
  onDeleteClick: (id: string, name: string) => void;
  startIndex: number;
}) {
  const allSelected = deals.length > 0 && selectedIds.size === deals.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < deals.length;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  (
                    el as HTMLButtonElement & { indeterminate: boolean }
                  ).indeterminate = someSelected;
                }
              }}
              onCheckedChange={onToggleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Target Raise</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal, index) => (
          <TableRow key={deal.id} className="group">
            <TableCell>
              <Checkbox
                checked={selectedIds.has(deal.id)}
                onCheckedChange={() => onToggleSelect(deal.id)}
                aria-label={`Select ${deal.name}`}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="font-medium">
              <Link
                href={`/admin/deals/${deal.id}`}
                className="hover:underline"
              >
                {deal.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[deal.status] as any}>
                {deal.status.replace(/_/g, " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={visibilityColors[deal.visibility] as any}>
                {deal.visibility.replace(/_/g, " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {deal.sector || "-"}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatCurrency(deal.targetRaise)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(deal.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>View Deal</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}/curate`}>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Manage Investors</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Edit Deal</TooltipContent>
                </Tooltip>
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteClick(deal.id, deal.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Deal</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Card View Component
function DealsCardView({
  deals,
  selectedIds,
  onToggleSelect,
  isAdmin,
  onDeleteClick,
}: {
  deals: Deal[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  isAdmin: boolean;
  onDeleteClick: (id: string, name: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="group border border-border rounded-lg overflow-hidden transition-colors hover:border-primary/50"
        >
          {deal.coverImageUrl && (
            <div className="relative w-full h-32 overflow-hidden bg-muted">
              <img
                src={deal.coverImageUrl}
                alt={deal.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-4 space-y-4">
            {/* Header with checkbox */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Checkbox
                  checked={selectedIds.has(deal.id)}
                  onCheckedChange={() => onToggleSelect(deal.id)}
                  aria-label={`Select ${deal.name}`}
                />
                <div className="min-w-0">
                  <Link
                    href={`/admin/deals/${deal.id}`}
                    className="font-semibold truncate block hover:text-primary transition-colors"
                  >
                    {deal.name}
                  </Link>
                  {deal.teaserSummary && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {deal.teaserSummary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusColors[deal.status] as any}>
                {deal.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant={visibilityColors[deal.visibility] as any}>
                {deal.visibility.replace(/_/g, " ")}
              </Badge>
              {deal.sector && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                  {deal.sector}
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium truncate">
                    {formatCurrency(deal.targetRaise)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium truncate">
                    {formatDate(deal.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}/curate`}>
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Manage Investors</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/deals/${deal.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              </div>
              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteClick(deal.id, deal.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Pagination Component
function PaginationControls({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsisStart = page > 3;
    const showEllipsisEnd = page < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (showEllipsisStart) {
        pages.push("...");
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      if (showEllipsisEnd) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, idx) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum as number)}
              className="min-w-[36px]"
            >
              {pageNum}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function DealsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const { data: session } = useClientSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isAdmin = session?.user?.role === "admin";

  // Get filter values from URL params
  const view = searchParams.get("dealsView") || "table";
  const status = searchParams.get("dealsStatus") || "all";
  const visibility = searchParams.get("dealsVisibility") || "all";
  const page = parseInt(searchParams.get("dealsPage") || "1", 10);

  // Debounced search with URL sync
  const {
    value: searchInput,
    onChange: setSearchInput,
    debouncedValue: search,
  } = useDebouncedSearch({
    paramKey: "dealsSearch",
  });

  // Fetch deals with React Query
  const { data, isLoading, isFetching, refetch } = useQuery(
    trpc.admin.getDeals.queryOptions({
      page,
      limit: 12,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      visibility: visibility !== "all" ? visibility : undefined,
    })
  );

  const deals = data?.deals ?? [];
  const pagination = data?.pagination;

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "" && value !== "1") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ dealsPage: newPage.toString() });
    },
    [updateParams]
  );

  // Mutation for deleting deals
  const { mutate: deleteDeal, isPending: isDeleting } = useMutation(
    trpc.deals.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Deal deleted successfully");
        refetch();
        setDeleteDialogOpen(false);
        setDealToDelete(null);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete deal");
      },
    })
  );

  const handleDeleteClick = (dealId: string, dealName: string) => {
    setDealToDelete({ id: dealId, name: dealName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (dealToDelete) {
      deleteDeal({ dealId: dealToDelete.id });
    }
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
    if (selectedIds.size === deals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deals.map((d) => d.id)));
    }
  };

  // Calculate start index for row numbers
  const startIndex = pagination ? (pagination.page - 1) * pagination.limit : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={status}
              onValueChange={(value) => {
                updateParams({ dealsStatus: value, dealsPage: "1" });
              }}
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

            {/* Visibility Filter */}
            <Select
              value={visibility}
              onValueChange={(value) => {
                updateParams({ dealsVisibility: value, dealsPage: "1" });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
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
              if (value) updateParams({ dealsView: value });
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
            {pagination?.totalCount ?? 0} deal
            {(pagination?.totalCount ?? 0) !== 1 ? "s" : ""} found
            {selectedIds.size > 0 && (
              <span className="ml-2">({selectedIds.size} selected)</span>
            )}
          </p>
          {isFetching && !isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : deals.length === 0 ? (
          <div className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-4">
                {search || status !== "all" || visibility !== "all"
                  ? "No deals match your filters. Try adjusting your search criteria."
                  : "No deals found. Create your first deal to get started."}
              </p>
              {!search && status === "all" && visibility === "all" && (
                <Link href="/admin/deals/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Deal
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : view === "table" ? (
          <DealsTableView
            deals={deals}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            isAdmin={isAdmin}
            onDeleteClick={handleDeleteClick}
            startIndex={startIndex}
          />
        ) : (
          <DealsCardView
            deals={deals}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            isAdmin={isAdmin}
            onDeleteClick={handleDeleteClick}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              deal "{dealToDelete?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Deal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

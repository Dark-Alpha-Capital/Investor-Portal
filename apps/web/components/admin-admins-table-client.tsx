
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition, memo, useMemo } from "react";
import {
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Shield,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Admin, AdminsData, Pagination } from "@/types/admin";

const VERIFIED_STATUSES = [
  { value: "all", label: "All Verified" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];

const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getInitials = (name: string | null) => {
  if (!name) return "A";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Table View Component
const AdminsTableView = memo(function AdminsTableView({
  admins,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  admins: Admin[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const allSelected = admins.length > 0 && selectedIds.size === admins.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < admins.length;

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
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow key={admin.id} className="group">
            <TableCell>
              <Checkbox
                checked={selectedIds.has(admin.id)}
                onCheckedChange={() => onToggleSelect(admin.id)}
                aria-label={`Select ${admin.name || admin.email}`}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(admin.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{admin.name || "N/A"}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {admin.email}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
                {admin.banned && (
                  <Badge variant="destructive">
                    <Ban className="mr-1 h-3 w-3" />
                    Banned
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {admin.emailVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Unverified
                    </span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDate(admin.createdAt)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

// Card View Component
const AdminsCardView = memo(function AdminsCardView({
  admins,
  selectedIds,
  onToggleSelect,
}: {
  admins: Admin[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {admins.map((admin) => (
        <div
          key={admin.id}
          className="group border border-border rounded-lg p-4 space-y-4 transition-colors hover:border-primary/50"
        >
          {/* Header with checkbox and avatar */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.has(admin.id)}
                onCheckedChange={() => onToggleSelect(admin.id)}
                aria-label={`Select ${admin.name || admin.email}`}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={admin.image || undefined} />
                <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{admin.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {admin.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              <Shield className="mr-1 h-3 w-3" />
              Admin
            </Badge>
            {admin.banned && (
              <Badge variant="destructive">
                <Ban className="mr-1 h-3 w-3" />
                Banned
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email Verified</span>
              <div className="flex items-center gap-1">
                {admin.emailVerified ? (
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
              <span>{formatDate(admin.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Pagination Component
const PaginationControls = memo(function PaginationControls({
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
        variant="ghost"
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
              variant={pageNum === page ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum as number)}
              className="min-w-[36px]"
            >
              {pageNum}
            </Button>
          ),
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});

type AdminsTableClientProps = {
  initialData?: AdminsData;
};

export function AdminsTableClient({ initialData }: AdminsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get filter values from URL params
  const view = searchParams.get("adminsView") || "table";
  const verified = searchParams.get("adminsVerified") || "all";
  const status = searchParams.get("adminsStatus") || "all";
  const page = parseInt(searchParams.get("adminsPage") || "1", 10);
  const search = searchParams.get("adminsSearch") || "";

  // Use server-fetched cached data directly
  const admins = initialData?.admins ?? [];
  const pagination = initialData?.pagination;

  // Update URL params - wrapped in transition to show pending state
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
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router, startTransition],
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ adminsPage: newPage.toString() });
    },
    [updateParams],
  );

  // Selection handlers - memoized for stability
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === admins.length) {
        return new Set();
      } else {
        return new Set(admins.map((a) => a.id));
      }
    });
  }, [admins]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <SearchInput
            paramKey="adminsSearch"
            placeholder="Search admins..."
            onResetPage={true}
          />

          {/* Verified Filter */}
          <Select
            value={verified}
            onValueChange={(value) => {
              updateParams({ adminsVerified: value, adminsPage: "1" });
            }}
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

          {/* Status Filter */}
          <Select
            value={status}
            onValueChange={(value) => {
              updateParams({ adminsStatus: value, adminsPage: "1" });
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
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
            if (value) updateParams({ adminsView: value });
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
          {pagination?.totalCount ?? 0} administrator
          {(pagination?.totalCount ?? 0) !== 1 ? "s" : ""} found
          {selectedIds.size > 0 && (
            <span className="ml-2">({selectedIds.size} selected)</span>
          )}
        </p>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      {admins.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No administrators match your filters.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : view === "table" ? (
        <AdminsTableView
          admins={admins}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      ) : (
        <AdminsCardView
          admins={admins}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
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
  );
}

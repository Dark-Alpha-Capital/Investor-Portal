import { useEffect, useMemo, useState } from "react";
import { AppLink as Link } from "@/components/app-link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  Building2,
  Lock,
  Search,
  X,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { ComplianceListData } from "@/lib/loaders/compliance";

type Clearance = {
  status: string;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
  clearedBy: string | null;
};

type Investor = ComplianceListData["investors"][number] & {
  clearance: Clearance | null;
};

const CLEARANCE_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "no_clearance", label: "No Status" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "needs_information", label: "Needs Information" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
    icon: React.ReactNode;
  }
> = {
  pending_review: {
    variant: "secondary",
    label: "Pending Review",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    variant: "default",
    label: "Approved",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  needs_information: {
    variant: "outline",
    label: "Needs Information",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  rejected: {
    variant: "destructive",
    label: "Rejected",
    icon: <ShieldX className="h-3 w-3" />,
  },
};

const getClearanceStatusBadge = (clearance: Clearance | null) => {
  if (!clearance) {
    return (
      <Badge variant="outline" className="gap-1">
        <ShieldQuestion className="h-3 w-3" />
        No Status
      </Badge>
    );
  }

  const config = STATUS_CONFIG[clearance.status] || STATUS_CONFIG.pending_review;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const formatDate = (date: Date | string | null) => {
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

function ComplianceSearchField({
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
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={draft ? "pl-9 pr-9" : "pl-9"}
        placeholder="Search by name or email..."
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

type ComplianceTableClientProps = {
  data: ComplianceListData;
  search: string;
  clearanceStatus: string;
  isFetching?: boolean;
  onSearchChange: (value: string) => void;
  onClearanceStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
};

export function ComplianceTableClient({
  data,
  search,
  clearanceStatus,
  isFetching = false,
  onSearchChange,
  onClearanceStatusChange,
  onPageChange,
}: ComplianceTableClientProps) {
  const { investors, pagination } = data;

  const paginationItems = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    const { page, totalPages } = pagination;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else if (page <= 4) {
      for (let i = 1; i <= 5; i++) items.push(i);
      items.push("ellipsis");
      items.push(totalPages);
    } else if (page >= totalPages - 3) {
      items.push(1);
      items.push("ellipsis");
      for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      items.push("ellipsis");
      for (let i = page - 1; i <= page + 1; i++) items.push(i);
      items.push("ellipsis");
      items.push(totalPages);
    }
    return items;
  }, [pagination]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ComplianceSearchField value={search} onValueChange={onSearchChange} />
        <Select value={clearanceStatus} onValueChange={onClearanceStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Clearance Status" />
          </SelectTrigger>
          <SelectContent>
            {CLEARANCE_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {investors.length} of {pagination.totalCount} investors
      </div>

      <div className="rounded-md border">
        <Table aria-label="Compliance investors table">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Investor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead>Deal Access</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No investors found.
                </TableCell>
              </TableRow>
            ) : (
              (investors as Investor[]).map((investor) => {
                const isCleared = investor.clearance?.status === "approved";
                const hasAccess = isCleared && investor.dealAccessCount > 0;

                return (
                  <TableRow key={investor.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={investor.image || undefined}
                            alt={investor.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(investor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {investor.name || "No Name"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {investor.email}
                    </TableCell>
                    <TableCell>
                      {investor.isOnboardingCompleted ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getClearanceStatusBadge(investor.clearance)}
                    </TableCell>
                    <TableCell>
                      {hasAccess ? (
                        <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="text-sm font-medium">
                            {investor.dealAccessCount} invitation
                            {investor.dealAccessCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : isCleared && investor.dealAccessCount === 0 ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="text-sm">No invitations</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" />
                          <span className="text-sm">Blocked</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(investor.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/admin/compliance/investors/${investor.id}`}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  pagination.page > 1 && onPageChange(pagination.page - 1)
                }
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                aria-label="Go to previous page"
                aria-disabled={pagination.page <= 1}
              />
            </PaginationItem>

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    onClick={() => onPageChange(item)}
                    isActive={item === pagination.page}
                    className="cursor-pointer"
                    aria-label={`Go to page ${item}`}
                    aria-current={item === pagination.page ? "page" : undefined}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  pagination.page < pagination.totalPages &&
                  onPageChange(pagination.page + 1)
                }
                className={
                  pagination.page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                aria-label="Go to next page"
                aria-disabled={pagination.page >= pagination.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

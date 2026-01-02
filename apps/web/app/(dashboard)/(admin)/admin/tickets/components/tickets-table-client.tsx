"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Clock,
  Loader2,
  Eye,
  Inbox,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { SearchInput } from "@/components/search-input";
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
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { CreateTicketDialog } from "./create-ticket-dialog";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  userId: string;
  assignedTo: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  resolvedAt: Date | null;
  investorName: string;
  investorEmail: string;
  assigneeName: string | null;
};

type TicketsData = {
  success: boolean;
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

const TICKET_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_user", label: "Pending User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const TICKET_PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TICKET_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "credentials", label: "Login/Credentials" },
  { value: "documents", label: "Documents" },
  { value: "profile", label: "Profile" },
  { value: "banking", label: "Banking" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const getStatusBadge = (status: string) => {
  const config: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }
  > = {
    open: {
      variant: "default",
      label: "Open",
      icon: <Inbox className="h-3 w-3" />,
    },
    in_progress: {
      variant: "secondary",
      label: "In Progress",
      icon: <Clock className="h-3 w-3" />,
    },
    pending_user: {
      variant: "outline",
      label: "Pending User",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    resolved: {
      variant: "default",
      label: "Resolved",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    closed: {
      variant: "secondary",
      label: "Closed",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const c = config[status] || config.open;
  return (
    <Badge variant={c.variant} className="gap-1">
      {c.icon}
      {c.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const config: Record<string, { className: string; label: string }> = {
    low: { className: "bg-green-100 text-green-800", label: "Low" },
    medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
    high: { className: "bg-orange-100 text-orange-800", label: "High" },
    urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
  };

  const c = config[priority] || config.medium;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    credentials: "Login/Credentials",
    documents: "Documents",
    profile: "Profile",
    banking: "Banking",
    investment: "Investment",
    other: "Other",
  };
  return labels[category] || category;
};

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type TicketsTableClientProps = {
  initialData: TicketsData;
  initialPage: number;
  initialStatus: string;
  initialPriority: string;
  initialCategory: string;
  initialAssignedTo: string;
  adminUsers: AdminUser[];
};

export function TicketsTableClient({
  initialData,
  initialStatus,
  initialPriority,
  initialCategory,
  initialAssignedTo,
  adminUsers,
}: TicketsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQueryParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      updateQueryParams({
        [key]: value === "all" ? undefined : value,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateQueryParams({ page: page.toString() });
    },
    [updateQueryParams]
  );

  const { tickets, pagination } = initialData;

  // Generate pagination items
  const getPaginationItems = () => {
    const items: (number | "ellipsis")[] = [];
    const { page, totalPages } = pagination;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (page <= 4) {
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
    }
    return items;
  };

  // Build assignee options
  const assigneeOptions = [
    { value: "all", label: "All Assignees" },
    { value: "unassigned", label: "Unassigned" },
    ...adminUsers.map((admin) => ({
      value: admin.id,
      label: admin.name || admin.email,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by subject or investor..."
              className="w-full max-w-full"
            />
          </div>
          <CreateTicketDialog />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={initialStatus}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialPriority}
            onValueChange={(v) => handleFilterChange("priority", v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialCategory}
            onValueChange={(v) => handleFilterChange("category", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialAssignedTo}
            onValueChange={(v) => handleFilterChange("assignedTo", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              {assigneeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {tickets.length} of {pagination.totalCount} tickets
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Subject</TableHead>
              <TableHead>Investor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="group">
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{ticket.investorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.investorEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getCategoryLabel(ticket.category)}
                  </TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    {ticket.assigneeName ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{ticket.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/tickets/${ticket.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  pagination.page > 1 && handlePageChange(pagination.page - 1)
                }
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getPaginationItems().map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    onClick={() => handlePageChange(item)}
                    isActive={item === pagination.page}
                    className="cursor-pointer"
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  pagination.page < pagination.totalPages &&
                  handlePageChange(pagination.page + 1)
                }
                className={
                  pagination.page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

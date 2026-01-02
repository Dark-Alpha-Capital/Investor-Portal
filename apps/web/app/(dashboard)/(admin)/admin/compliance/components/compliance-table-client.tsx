"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type Clearance = {
  status: string;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
  clearedBy: string | null;
};

type Investor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date | null;
  kycStatus: string | null;
  isOnboardingCompleted: boolean | null;
  clearance: Clearance | null;
};

type ComplianceData = {
  success: boolean;
  investors: Investor[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

const CLEARANCE_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "no_clearance", label: "No Clearance" },
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "cleared_with_conditions", label: "Cleared w/ Conditions" },
  { value: "rejected", label: "Rejected" },
];

const ITEMS_PER_PAGE = 12;

const getClearanceStatusBadge = (clearance: Clearance | null) => {
  if (!clearance) {
    return (
      <Badge variant="outline" className="gap-1">
        <ShieldQuestion className="h-3 w-3" />
        No Clearance
      </Badge>
    );
  }

  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      variant: "secondary",
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
    },
    cleared: {
      variant: "default",
      label: "Cleared",
      icon: <ShieldCheck className="h-3 w-3" />,
    },
    cleared_with_conditions: {
      variant: "outline",
      label: "Conditional",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      icon: <ShieldX className="h-3 w-3" />,
    },
  };

  const config = statusConfig[clearance.status] || statusConfig.pending;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const formatDate = (date: Date | null) => {
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

type ComplianceTableClientProps = {
  initialData: ComplianceData;
  initialPage: number;
  initialClearanceStatus: string;
};

export function ComplianceTableClient({
  initialData,
  initialClearanceStatus,
}: ComplianceTableClientProps) {
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

  const handleClearanceStatusChange = useCallback(
    (value: string) => {
      updateQueryParams({
        clearanceStatus: value === "all" ? undefined : value,
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

  const { investors, pagination } = initialData;

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name or email..."
            className="w-full max-w-full"
          />
        </div>
        <Select
          value={initialClearanceStatus}
          onValueChange={handleClearanceStatusChange}
        >
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
        Showing {investors.length} of {pagination.totalCount} investors
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Investor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No investors found.
                </TableCell>
              </TableRow>
            ) : (
              investors.map((investor) => (
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
                  <TableCell>{getClearanceStatusBadge(investor.clearance)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(investor.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/admin/compliance/investors/${investor.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
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

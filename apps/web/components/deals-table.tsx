import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Eye,
  Trash2,
  Plus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useClientSession } from "@/lib/auth/get-client-session";
import { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { DealsIndexDeal } from "@/lib/loaders/deals";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const statusColors: Record<string, BadgeVariant> = {
  draft: "secondary",
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

const formatCurrency = (value: string | null) => {
  if (value === null || value === undefined) return "-";
  const numValue = parseFloat(value);
  if (Number.isNaN(numValue)) return "-";
  if (numValue >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
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

type DealsTableProps = {
  deals: DealsIndexDeal[];
  currentPage: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
};

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
          ),
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

export function DealsTable({
  deals,
  currentPage,
  limit,
  totalCount,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  hasFilters,
  onPageChange,
}: DealsTableProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useClientSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isAdmin = session?.user?.role === "admin";
  const startIndex = (currentPage - 1) * limit;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, deals]);

  const invalidateDealLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["deals", "index"] }),
      queryClient.invalidateQueries({ queryKey: ["kanban"] }),
    ]);
  };

  const { mutate: removeDeal, isPending: isDeleting } = useMutation(
    trpc.deals.remove.mutationOptions({
      onSuccess: async () => {
        toast.success("Deal deleted successfully");
        setDeleteDialogOpen(false);
        setDealToDelete(null);
        setDeleteReason("");
        await invalidateDealLists();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to delete deal");
      },
    }),
  );

  const { mutate: restoreDeal, isPending: isRestoring } = useMutation(
    trpc.deals.restore.mutationOptions({
      onSuccess: async () => {
        toast.success("Deal restored successfully");
        await invalidateDealLists();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to restore deal");
      },
    }),
  );

  const handleDeleteClick = (dealId: string, dealName: string) => {
    setDealToDelete({ id: dealId, name: dealName });
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  const handleRestoreClick = (dealId: string) => {
    restoreDeal({ dealId });
  };

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

  const allSelected = deals.length > 0 && selectedIds.size === deals.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < deals.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount} deal{totalCount !== 1 ? "s" : ""} found
            {selectedIds.size > 0 ? (
              <span className="ml-2">({selectedIds.size} selected)</span>
            ) : null}
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "No deals match your filters. Try adjusting your search criteria."
                  : "No deals found. Create your first deal to get started."}
              </p>
              {!hasFilters ? (
                <Link to="/admin/deals/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Deal
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
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
                      onCheckedChange={() => handleToggleSelect(deal.id)}
                      aria-label={`Select ${deal.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      to="/admin/deals/$dealId"
                      params={{ dealId: deal.id }}
                      className="hover:underline"
                    >
                      {deal.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {deal.deletedAt ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant={statusColors[deal.status]}>
                        {deal.status.replace(/_/g, " ")}
                      </Badge>
                    )}
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
                          <Link
                            to="/admin/deals/$dealId"
                            params={{ dealId: deal.id }}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View Deal</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to="/admin/deals/$dealId/edit"
                            params={{ dealId: deal.id }}
                          >
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Edit Deal</TooltipContent>
                      </Tooltip>
                      {isAdmin ? (
                        deal.deletedAt ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreClick(deal.id)}
                                disabled={isRestoring}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore Deal</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteClick(deal.id, deal.name)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Deal</TooltipContent>
                          </Tooltip>
                        )
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 ? (
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPreviousPage}
            onPageChange={onPageChange}
          />
        ) : null}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide &quot;{dealToDelete?.name}&quot; from investors and
              admin views. All records (invitations, interests, commitments,
              documents) are preserved so the deal can be restored at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="delete-reason"
              className="text-sm font-medium text-foreground"
            >
              Reason for deletion
            </label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Required — e.g. deal cancelled by sponsors, withdrawn from market"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteReason("");
                setDealToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dealToDelete && deleteReason.trim().length >= 5) {
                  removeDeal({
                    dealId: dealToDelete.id,
                    reason: deleteReason.trim(),
                  });
                }
              }}
              disabled={
                isDeleting || deleteReason.trim().length < 5
              }
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

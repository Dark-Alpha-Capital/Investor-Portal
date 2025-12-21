"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Edit, Eye, Trash2, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
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
  targetRaise: number | null;
  minInvestment: number | null;
  targetIrr: number | null;
  targetMoic: number | null;
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: Date | null;
  closeDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
};

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

export function DealsTable({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session } = useClientSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const isAdmin = session?.user?.role === "admin";

  const { mutate: deleteDeal, isPending: isDeleting } = useMutation(
    trpc.deals.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Deal deleted successfully");
        router.refresh();
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

  if (deals.length === 0) {
    return (
      <div className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground mb-4">
            No deals found. Create your first deal to get started.
          </p>
          <Link href="/admin/deals/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Deal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
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
            <TableRow key={deal.id}>
              <TableCell className="text-muted-foreground">
                {index + 1}
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
              <TableCell>{deal.sector || "-"}</TableCell>
              <TableCell>
                {deal.targetRaise
                  ? `$${deal.targetRaise.toLocaleString()}`
                  : "-"}
              </TableCell>
              <TableCell>{deal.createdAt.toLocaleDateString()}</TableCell>
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
                          onClick={() => handleDeleteClick(deal.id, deal.name)}
                          disabled={isDeleting}
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

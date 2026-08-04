import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

type DealDeleteActionsProps = {
  dealId: string;
  dealName: string;
  isDeleted: boolean;
  investmentsCount: number;
};

export function DealDeleteActions({
  dealId,
  dealName,
  isDeleted,
  investmentsCount,
}: DealDeleteActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const invalidate = async () => {
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
        await invalidate();
        router.invalidate();
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
        await invalidate();
        router.invalidate();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to restore deal");
      },
    }),
  );

  const { mutate: purgeDeal, isPending: isPurging } = useMutation(
    trpc.deals.purge.mutationOptions({
      onSuccess: async () => {
        toast.success("Deal permanently deleted");
        setPurgeDialogOpen(false);
        await invalidate();
        router.navigate({ to: "/admin/deals" });
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to permanently delete deal");
      },
    }),
  );

  const canPurge = investmentsCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDeleted ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => restoreDeal({ dealId })}
                disabled={isRestoring}
                aria-label="Restore deal"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Restore deal</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setDeleteReason("");
                setDeleteDialogOpen(true);
              }}
              aria-label="Delete deal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete deal</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button
              variant="destructive"
              size="icon"
              disabled={!canPurge || isPurging}
              onClick={() => setPurgeDialogOpen(true)}
              aria-label="Delete permanently"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        {!canPurge ? (
          <TooltipContent>
            Cannot permanently delete: deal has {investmentsCount} active{" "}
            {investmentsCount === 1 ? "commitment" : "commitments"}. Soft-delete
            the deal instead.
          </TooltipContent>
        ) : (
          <TooltipContent>Delete permanently</TooltipContent>
        )}
      </Tooltip>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide &quot;{dealName}&quot; from investors and admin
              views. All records are preserved so the deal can be restored at
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="detail-delete-reason"
              className="text-sm font-medium text-foreground"
            >
              Reason for deletion
            </label>
            <Textarea
              id="detail-delete-reason"
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
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteReason.trim().length >= 5) {
                  removeDeal({ dealId, reason: deleteReason.trim() });
                }
              }}
              disabled={isDeleting || deleteReason.trim().length < 5}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Deal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &quot;{dealName}&quot; and all associated
              data (documents, invitations, interests, Q&amp;A) from the
              database. This action cannot be undone and is only allowed when
              the deal has no investor commitments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purgeDeal({ dealId })}
              disabled={isPurging || !canPurge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPurging ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

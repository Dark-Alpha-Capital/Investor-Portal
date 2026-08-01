import { useState } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { formatIntegerInput, parseFormattedInteger } from "@/lib/utils";

type UserInterest = {
  id: string;
  status: string;
  proposedAmount: string | null;
  createdAt: string;
  updatedAt: string | null;
} | null;

type DealPermissions = {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  accessLevel?: "teaser" | "data_room" | null;
  dataRoomRequestedAt?: string | null;
};

type DealActionsProps = {
  dealId: string;
  userInterest: UserInterest;
  minInvestment: string | null;
  permissions: DealPermissions;
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export function DealActions({
  dealId,
  userInterest,
  minInvestment,
  permissions,
}: DealActionsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [isInterestDialogOpen, setIsInterestDialogOpen] = useState(false);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState(() =>
    formatIntegerInput(userInterest?.proposedAmount),
  );
  const [commitAmount, setCommitAmount] = useState(() =>
    formatIntegerInput(userInterest?.proposedAmount),
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const canExpressInterest = permissions.canExpressInterest;
  const canInvest = permissions.canInvest;
  const isTeaserOnly =
    permissions.accessLevel === "teaser" ||
    (!canExpressInterest && permissions.canViewTeaser);
  const hasPendingDataRoomRequest = !!permissions.dataRoomRequestedAt;
  const hasInterest =
    !!userInterest &&
    userInterest.status !== "pass";

  const { mutate: requestDataRoom, isPending: isRequestingAccess } =
    useMutation(
      trpc.deals.requestDataRoomAccess.mutationOptions({
        onSuccess: (data) => {
          toast.success(data.message);
          setLoadingAction(null);
          router.refresh();
        },
        onError: (error: { message?: string }) => {
          toast.error(error.message || "Failed to request access");
          setLoadingAction(null);
        },
      }),
    );

  const { mutate: expressInterest } = useMutation(
    trpc.deals.expressInterest.mutationOptions({
      onSuccess: () => {
        toast.success(
          "Thanks! Our investment team will follow up with next steps.",
        );
        setIsInterestDialogOpen(false);
        setLoadingAction(null);
        router.refresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to express interest");
        setLoadingAction(null);
      },
    }),
  );

  const { mutate: commitCapital } = useMutation(
    trpc.investments.commit.mutationOptions({
      onSuccess: () => {
        toast.success("Capital commitment recorded.");
        setIsCommitDialogOpen(false);
        setCommitAmount("");
        setLoadingAction(null);
        router.refresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to commit capital");
        setLoadingAction(null);
      },
    }),
  );

  const submitInterest = () => {
    const amount = parseFormattedInteger(estimatedAmount);
    if (estimatedAmount.trim() && (amount == null || amount <= 0)) {
      toast.error("Please enter a valid estimated amount, or leave it blank");
      return;
    }
    setLoadingAction("interest");
    expressInterest({
      dealId,
      status: "interested",
      ...(amount != null && amount > 0 ? { proposedAmount: amount } : {}),
    });
  };

  const handleCommitCapital = () => {
    const amount = parseFormattedInteger(commitAmount);
    if (amount == null || amount <= 0) {
      toast.error("Please enter a valid commitment amount");
      return;
    }
    setLoadingAction("commit");
    commitCapital({
      dealId,
      committedAmount: amount,
    });
  };

  if (isTeaserOnly || !canExpressInterest) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold mb-2 text-amber-800 dark:text-amber-200">
            Teaser Access
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            You can view the teaser for this deal. Request data room access to
            review documents, express interest, and commit capital.
          </p>
          {hasPendingDataRoomRequest ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Request pending
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                An administrator has been notified and will review your request
                to upgrade this invitation to Data Room access.
              </p>
            </div>
          ) : (
            <Button
              onClick={() => {
                setLoadingAction("request");
                requestDataRoom({ dealId });
              }}
              disabled={isRequestingAccess || loadingAction === "request"}
            >
              {isRequestingAccess || loadingAction === "request"
                ? "Requesting…"
                : "Request Data Room Access"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasInterest ? (
        <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
          <h3 className="text-sm font-semibold mb-2">Your Current Status</h3>
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">Interested</span>
            {userInterest?.proposedAmount ? (
              <>
                {" "}
                · Estimated:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(userInterest.proposedAmount)}
                </span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {canExpressInterest && !canInvest ? (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> You can express interest in this deal, but
            investment commitment requires additional clearance. Contact our IR
            team for details.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <Dialog
          open={isInterestDialogOpen}
          onOpenChange={setIsInterestDialogOpen}
        >
          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium mb-1">
                  {hasInterest ? "Update Interest" : "Express Interest"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Let our investment team know you&apos;re interested. You can
                  optionally share an estimated check size — this is non-binding.
                </p>
              </div>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant={hasInterest ? "secondary" : "default"}
                  onClick={() =>
                    setEstimatedAmount(
                      formatIntegerInput(userInterest?.proposedAmount),
                    )
                  }
                >
                  {hasInterest ? "Update" : "Express Interest"}
                </Button>
              </DialogTrigger>
            </div>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {hasInterest ? "Update Interest" : "Express Interest"}
              </DialogTitle>
              <DialogDescription>
                Our investment team will follow up with next steps. Estimated
                amount is optional and non-binding.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="estimated-amount">
                  Estimated Investment{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="estimated-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="250,000"
                    className="pl-7"
                    value={estimatedAmount}
                    onChange={(e) =>
                      setEstimatedAmount(formatIntegerInput(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsInterestDialogOpen(false);
                  setEstimatedAmount(
                    formatIntegerInput(userInterest?.proposedAmount),
                  );
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitInterest}
                disabled={loadingAction === "interest"}
              >
                {loadingAction === "interest" ? "Saving…" : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {canInvest ? (
          <Dialog
            open={isCommitDialogOpen}
            onOpenChange={setIsCommitDialogOpen}
          >
            <div className="border rounded-lg p-4 border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Commit Capital</h4>
                  <p className="text-sm text-muted-foreground">
                    Record a capital commitment for this deal. Funds are not
                    wired yet — our team will coordinate next steps.
                  </p>
                  {minInvestment ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum investment: {formatCurrency(minInvestment)}
                    </p>
                  ) : null}
                </div>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() =>
                      setCommitAmount(
                        formatIntegerInput(userInterest?.proposedAmount),
                      )
                    }
                  >
                    Commit
                  </Button>
                </DialogTrigger>
              </div>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Commit Capital</DialogTitle>
                <DialogDescription>
                  Enter the exact amount you are committing. This records your
                  commitment only — money is not wired yet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commit-amount">Commitment Amount</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="commit-amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="500,000"
                      className="pl-7"
                      value={commitAmount}
                      onChange={(e) =>
                        setCommitAmount(formatIntegerInput(e.target.value))
                      }
                    />
                  </div>
                  {minInvestment ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum investment: {formatCurrency(minInvestment)}
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCommitDialogOpen(false);
                    setCommitAmount("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCommitCapital}
                  disabled={
                    loadingAction === "commit" ||
                    (parseFormattedInteger(commitAmount) ?? 0) <= 0
                  }
                >
                  {loadingAction === "commit" ? "Committing…" : "I Commit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </div>
  );
}

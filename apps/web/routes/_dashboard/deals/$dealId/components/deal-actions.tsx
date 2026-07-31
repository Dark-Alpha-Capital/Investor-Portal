
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
};

type DealActionsProps = {
  dealId: string;
  userInterest: UserInterest;
  minInvestment: string | null;
  permissions: DealPermissions;
};

const interestStatusLabels: Record<string, string> = {
  interested: "Interested",
  soft_committed: "Soft Committed",
  pass: "Passed",
  meeting_requested: "Meeting Requested",
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
  const [isSoftCommitDialogOpen, setIsSoftCommitDialogOpen] = useState(false);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [proposedAmount, setProposedAmount] = useState<string>(
    userInterest?.proposedAmount || "",
  );
  const [commitAmount, setCommitAmount] = useState<string>(
    userInterest?.proposedAmount || "",
  );

  // Separate loading states for each action
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Check permissions
  const canExpressInterest = permissions.canExpressInterest;
  const canInvest = permissions.canInvest;

  const { mutate: expressInterest } = useMutation(
    trpc.deals.expressInterest.mutationOptions({
      onSuccess: () => {
        toast.success("Interest sent – IR Team will contact you.");
        setIsSoftCommitDialogOpen(false);
        setProposedAmount("");
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

  const handleCommitCapital = () => {
    const amount = parseFloat(commitAmount);
    if (!commitAmount || amount <= 0) {
      toast.error("Please enter a valid commitment amount");
      return;
    }
    setLoadingAction("commit");
    commitCapital({
      dealId,
      committedAmount: amount,
    });
  };

  const handleInterestedClick = () => {
    setLoadingAction("interested");
    expressInterest({
      dealId,
      status: "interested",
    });
  };

  const handleSoftCommitSubmit = () => {
    if (!proposedAmount || parseFloat(proposedAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoadingAction("soft_committed");
    expressInterest({
      dealId,
      status: "soft_committed",
      proposedAmount: parseFloat(proposedAmount),
    });
  };

  const handleUpdateStatus = (
    status: "soft_committed" | "pass" | "meeting_requested",
    amount?: number,
  ) => {
    if (status === "soft_committed" && (!amount || amount <= 0)) {
      toast.error("Please enter a valid amount for soft commit");
      return;
    }
    setLoadingAction(status);
    expressInterest({
      dealId,
      status,
      proposedAmount: amount,
    });
    setProposedAmount("");
  };

  const handlePassClick = () => {
    handleUpdateStatus("pass");
  };

  const handleMeetingRequestClick = () => {
    handleUpdateStatus("meeting_requested");
  };

  // If user doesn't have permission to express interest, show restricted message
  if (!canExpressInterest) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold mb-2 text-amber-800 dark:text-amber-200">
            Limited Access
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your current permissions do not allow expressing interest in this
            deal. Please contact our IR team if you would like to learn more
            about this opportunity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Display */}
      {userInterest && (
        <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
          <h3 className="text-sm font-semibold mb-2">Your Current Status</h3>
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {interestStatusLabels[userInterest.status] || userInterest.status}
            </span>
            {userInterest.proposedAmount && (
              <>
                {" "}
                • Amount:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(userInterest.proposedAmount)}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Show invest restriction notice if can express interest but can't invest */}
      {canExpressInterest && !canInvest && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> You can express interest in this deal, but
            investment commitment requires additional clearance. Contact our IR
            team for details.
          </p>
        </div>
      )}

      {canInvest ? (
        <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
          <div className="border rounded-lg p-4 border-primary/30 bg-primary/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium mb-1">Commit Capital</h4>
                <p className="text-sm text-muted-foreground">
                  Submit a capital commitment for this deal. This records your
                  commitment before funds are wired. Status will move through
                  Committed → Pending → Confirmed → Funded.
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
                    setCommitAmount(userInterest?.proposedAmount || "")
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
                Enter the amount you are committing. Money is not wired yet —
                this records your commitment only.
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
                    type="number"
                    placeholder="250000"
                    className="pl-7"
                    value={commitAmount}
                    onChange={(e) => setCommitAmount(e.target.value)}
                    min="0"
                    step="1000"
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
                  !commitAmount ||
                  parseFloat(commitAmount) <= 0
                }
              >
                {loadingAction === "commit" ? "Committing..." : "I Commit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {!userInterest ? (
        // Initial interest options
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Express Your Interest
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Let us know how you'd like to proceed with this deal
            </p>
          </div>

          <div className="space-y-3">
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">I'm Interested</h4>
                  <p className="text-sm text-muted-foreground">
                    Express general interest in this deal. Our IR team will
                    reach out to discuss further details and answer any
                    questions you may have.
                  </p>
                </div>
                <Button
                  onClick={handleInterestedClick}
                  disabled={loadingAction === "interested"}
                  size="sm"
                >
                  {loadingAction === "interested" ? "Sending..." : "Select"}
                </Button>
              </div>
            </div>

            <Dialog
              open={isSoftCommitDialogOpen}
              onOpenChange={setIsSoftCommitDialogOpen}
            >
              <DialogTrigger asChild>
                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Soft Commit</h4>
                      <p className="text-sm text-muted-foreground">
                        Indicate a specific investment amount you're
                        considering. This is non-binding and helps us understand
                        your level of interest. You can change or withdraw this
                        commitment at any time.
                      </p>
                      {minInvestment && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Minimum investment: {formatCurrency(minInvestment)}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="default">
                      Select
                    </Button>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Soft Commit</DialogTitle>
                  <DialogDescription>
                    Enter the amount you're considering for this investment.
                    This is non-binding and can be changed later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Investment Amount</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50,000"
                        className="pl-7"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        min="0"
                        step="1000"
                      />
                    </div>
                    {minInvestment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum investment: {formatCurrency(minInvestment)}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsSoftCommitDialogOpen(false);
                      setProposedAmount("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSoftCommitSubmit}
                    disabled={
                      loadingAction === "soft_committed" ||
                      !proposedAmount ||
                      parseFloat(proposedAmount) <= 0
                    }
                  >
                    {loadingAction === "soft_committed"
                      ? "Submitting..."
                      : "Submit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        // Update status options
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Update Your Position</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Change your interest status or take action on this deal
            </p>
          </div>

          <div className="space-y-3">
            <Dialog
              open={isSoftCommitDialogOpen}
              onOpenChange={setIsSoftCommitDialogOpen}
            >
              <DialogTrigger asChild>
                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">
                        Soft Commit
                        {userInterest.proposedAmount &&
                          ` (${formatCurrency(userInterest.proposedAmount)})`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Update your investment amount or set a new soft commit.
                        This is non-binding and can be changed at any time.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setProposedAmount(userInterest.proposedAmount || "");
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Soft Commit</DialogTitle>
                  <DialogDescription>
                    Enter the amount you're considering for this investment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount-update">Investment Amount</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount-update"
                        type="number"
                        placeholder="50,000"
                        className="pl-7"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        min="0"
                        step="1000"
                      />
                    </div>
                    {minInvestment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum investment: {formatCurrency(minInvestment)}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsSoftCommitDialogOpen(false);
                      setProposedAmount("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(
                        "soft_committed",
                        parseFloat(proposedAmount),
                      )
                    }
                    disabled={
                      loadingAction === "soft_committed" ||
                      !proposedAmount ||
                      parseFloat(proposedAmount) <= 0
                    }
                  >
                    {loadingAction === "soft_committed"
                      ? "Updating..."
                      : "Update"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Request Meeting</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule a meeting with our IR team to discuss this deal in
                    detail and get your questions answered.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleMeetingRequestClick}
                  disabled={loadingAction === "meeting_requested"}
                >
                  {loadingAction === "meeting_requested"
                    ? "Sending..."
                    : "Request"}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Pass</h4>
                  <p className="text-sm text-muted-foreground">
                    Indicate that you're not interested in pursuing this deal at
                    this time.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePassClick}
                  disabled={loadingAction === "pass"}
                >
                  {loadingAction === "pass" ? "Updating..." : "Pass"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { InitialsTile } from "@/components/initials-tile";
import { toast } from "sonner";
import { DollarSign, TrendingUp, PiggyBank } from "lucide-react";
import { AppLink as Link } from "@/components/app-link";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
  isArchivedCommitmentStatus,
  isPortfolioModeStatus,
  isPreFundingStatus,
} from "@repo/db/investment-closing";
import { AdminClosingPackagePanel } from "@/components/closing/admin-closing-package-panel";
import { InvestmentStatusChip } from "@/components/closing/status-chips";

type Investment = {
  id: string;
  userId: string;
  committedAmount: string;
  fundedAmount: string | null;
  currentValue: string | null;
  distributions: string | null;
  status: string;
  ownershipPercentage: string | null;
  committedDate: string;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type DealInterest = {
  id: string;
  userId: string;
  status: string;
  proposedAmount: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type InvestmentManagementProps = {
  dealId: string;
  investments: Investment[];
  interests: DealInterest[];
  onRefresh: () => void;
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function InvestmentManagement({
  investments,
  onRefresh,
}: InvestmentManagementProps) {
  const trpc = useTRPC();
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  const [portfolioForm, setPortfolioForm] = useState({
    currentValue: "",
    distributions: "",
    status: "" as "" | "transferred" | "liquidated" | "written_off",
    ownershipPercentage: "",
  });

  useEffect(() => {
    if (selectedInvestment && isPortfolioDialogOpen) {
      const exitStatus =
        selectedInvestment.status === "transferred" ||
        selectedInvestment.status === "liquidated" ||
        selectedInvestment.status === "written_off"
          ? selectedInvestment.status
          : "";
      setPortfolioForm({
        currentValue: selectedInvestment.currentValue || "",
        distributions: selectedInvestment.distributions || "",
        status: exitStatus,
        ownershipPercentage: selectedInvestment.ownershipPercentage || "",
      });
    }
  }, [selectedInvestment, isPortfolioDialogOpen]);

  const { mutate: updatePortfolio, isPending: isUpdating } = useMutation(
    trpc.investments.update.mutationOptions({
      onSuccess: () => {
        toast.success("Portfolio updated");
        setIsPortfolioDialogOpen(false);
        setSelectedInvestment(null);
        onRefresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to update portfolio");
      },
    }),
  );

  const handleUpdatePortfolio = () => {
    if (!selectedInvestment) return;

    updatePortfolio({
      investmentId: selectedInvestment.id,
      ...(portfolioForm.currentValue
        ? { currentValue: parseFloat(portfolioForm.currentValue) }
        : {}),
      ...(portfolioForm.distributions
        ? { distributions: parseFloat(portfolioForm.distributions) }
        : {}),
      ...(portfolioForm.ownershipPercentage
        ? {
            ownershipPercentage: parseFloat(portfolioForm.ownershipPercentage),
          }
        : {}),
      ...(portfolioForm.status ? { status: portfolioForm.status } : {}),
    });
  };

  const totalCommitted = investments
    .filter((inv) => !isArchivedCommitmentStatus(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.committedAmount || "0"), 0);

  const totalFunded = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.fundedAmount || "0"),
    0,
  );

  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.currentValue || "0"),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-card px-5 py-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <DollarSign className="size-3.5" />
            Active committed
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(totalCommitted.toString())}
          </p>
        </div>
        <div className="bg-card px-5 py-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <DollarSign className="size-3.5" />
            Total funded
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(totalFunded.toString())}
          </p>
        </div>
        <div className="bg-card px-5 py-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <TrendingUp className="size-3.5" />
            Current value (NAV)
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-primary">
            {formatCurrency(totalCurrentValue.toString())}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <header className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight">
            Capital commitments
          </h2>
          <p className="text-sm text-muted-foreground">
            Investors commit from the deal page. Use Closing for documents and
            funding; Portfolio for NAV after funds are received.
          </p>
        </header>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
                <PiggyBank className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                No commitments yet. Investors commit from the deal page.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Investor
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Committed
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Funded
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Current value
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Distributions
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Ownership
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Committed date
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => {
                  const showPortfolio = isPortfolioModeStatus(inv.status);
                  const closingPrimary =
                    isPreFundingStatus(inv.status) ||
                    isArchivedCommitmentStatus(inv.status);

                  return (
                    <TableRow key={inv.id} className="transition-colors hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialsTile name={inv.user.name} />
                          <Link
                            href={`/admin/compliance/investors/${inv.user.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {inv.user.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InvestmentStatusChip status={inv.status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatCurrency(inv.committedAmount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatCurrency(inv.fundedAmount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatCurrency(inv.currentValue)}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatCurrency(inv.distributions)}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatPercentage(inv.ownershipPercentage)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatDate(inv.committedDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={closingPrimary ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setIsClosingDialogOpen(true);
                            }}
                          >
                            Closing
                          </Button>
                          {showPortfolio ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedInvestment(inv);
                                setIsPortfolioDialogOpen(true);
                              }}
                            >
                              Portfolio
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Dialog open={isClosingDialogOpen} onOpenChange={setIsClosingDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Closing</DialogTitle>
            <DialogDescription>
              Documents, signatures, funding, and audit for this commitment
              attempt.
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment ? (
            <AdminClosingPackagePanel
              investmentId={selectedInvestment.id}
              onRefresh={onRefresh}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPortfolioDialogOpen}
        onOpenChange={setIsPortfolioDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Portfolio</DialogTitle>
            <DialogDescription>
              Post-funding administration only — NAV, distributions, ownership,
              and exit events. Closing status is not edited here.
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  {selectedInvestment.user.name} —{" "}
                  {formatCurrency(selectedInvestment.committedAmount)} committed
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Closing status:</span>
                  <InvestmentStatusChip status={selectedInvestment.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentValue">Current Value (NAV)</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    placeholder={selectedInvestment.currentValue || "0"}
                    value={portfolioForm.currentValue}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        currentValue: e.target.value,
                      })
                    }
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="distributions">Distributions</Label>
                  <Input
                    id="distributions"
                    type="number"
                    placeholder={selectedInvestment.distributions || "0"}
                    value={portfolioForm.distributions}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        distributions: e.target.value,
                      })
                    }
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="ownershipPercentage">
                    Ownership Percentage
                  </Label>
                  <Input
                    id="ownershipPercentage"
                    type="number"
                    placeholder={
                      selectedInvestment.ownershipPercentage || "0"
                    }
                    value={portfolioForm.ownershipPercentage}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        ownershipPercentage: e.target.value,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="exitStatus">Exit status (optional)</Label>
                  <Select
                    value={portfolioForm.status || "none"}
                    onValueChange={(value) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        status:
                          value === "none"
                            ? ""
                            : (value as
                                | "transferred"
                                | "liquidated"
                                | "written_off"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keep active (funded)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Active (no exit)</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="liquidated">Liquidated</SelectItem>
                      <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPortfolioDialogOpen(false);
                setSelectedInvestment(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePortfolio} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save Portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

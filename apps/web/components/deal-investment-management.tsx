import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Plus, Edit, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { AppLink as Link } from "@/components/app-link";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

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

const investmentStatusLabels: Record<string, string> = {
  committed: "Committed",
  pending: "Pending",
  confirmed: "Confirmed",
  funded: "Funded",
  transferred: "Transferred",
  liquidated: "Liquidated",
  written_off: "Written Off",
};

const investmentStatusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  committed: "secondary",
  pending: "outline",
  confirmed: "default",
  funded: "default",
  transferred: "secondary",
  liquidated: "secondary",
  written_off: "destructive",
};

const ADVANCE_LABEL: Record<string, string> = {
  committed: "Mark Pending",
  pending: "Confirm",
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
  dealId,
  investments,
  interests,
  onRefresh,
}: InvestmentManagementProps) {
  const trpc = useTRPC();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const [createForm, setCreateForm] = useState({
    userId: "",
    committedAmount: "",
    committedDate: new Date().toISOString().split("T")[0],
    ownershipPercentage: "",
  });

  const [updateForm, setUpdateForm] = useState({
    currentValue: "",
    distributions: "",
    status: "",
    ownershipPercentage: "",
  });

  const { data: investorsData, isLoading: isLoadingInvestors } = useQuery({
    ...trpc.deals.getInvestors.queryOptions(),
    enabled: isCreateDialogOpen,
  });
  const investors = investorsData?.investors ?? [];

  useEffect(() => {
    if (selectedInvestment && isUpdateDialogOpen) {
      setUpdateForm({
        currentValue: selectedInvestment.currentValue || "",
        distributions: selectedInvestment.distributions || "",
        status: selectedInvestment.status,
        ownershipPercentage: selectedInvestment.ownershipPercentage || "",
      });
    }
  }, [selectedInvestment, isUpdateDialogOpen]);

  const { mutate: createInvestment, isPending: isCreating } = useMutation(
    trpc.investments.create.mutationOptions({
      onSuccess: () => {
        toast.success("Capital commitment created");
        setIsCreateDialogOpen(false);
        setCreateForm({
          userId: "",
          committedAmount: "",
          committedDate: new Date().toISOString().split("T")[0],
          ownershipPercentage: "",
        });
        onRefresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to create commitment");
      },
    }),
  );

  const { mutate: advanceStatus, isPending: isAdvancing } = useMutation(
    trpc.investments.advanceStatus.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        onRefresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to advance status");
      },
    }),
  );

  const { mutate: recordFunding, isPending: isFunding } = useMutation(
    trpc.investments.recordFunding.mutationOptions({
      onSuccess: () => {
        toast.success("Funding recorded");
        setIsFundDialogOpen(false);
        setSelectedInvestment(null);
        setFundAmount("");
        onRefresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to record funding");
      },
    }),
  );

  const { mutate: updateInvestment, isPending: isUpdating } = useMutation(
    trpc.investments.update.mutationOptions({
      onSuccess: () => {
        toast.success("Investment updated");
        setIsUpdateDialogOpen(false);
        setSelectedInvestment(null);
        onRefresh();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to update investment");
      },
    }),
  );

  const handleCreateInvestment = () => {
    if (!createForm.userId || !createForm.committedAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    createInvestment({
      dealId,
      userId: createForm.userId,
      committedAmount: parseFloat(createForm.committedAmount),
      committedDate: createForm.committedDate,
      ownershipPercentage: createForm.ownershipPercentage
        ? parseFloat(createForm.ownershipPercentage)
        : null,
    });
  };

  const handleUpdateInvestment = () => {
    if (!selectedInvestment) return;

    updateInvestment({
      investmentId: selectedInvestment.id,
      ...(updateForm.currentValue
        ? { currentValue: parseFloat(updateForm.currentValue) }
        : {}),
      ...(updateForm.distributions
        ? { distributions: parseFloat(updateForm.distributions) }
        : {}),
      ...(updateForm.ownershipPercentage
        ? { ownershipPercentage: parseFloat(updateForm.ownershipPercentage) }
        : {}),
      ...(updateForm.status
        ? {
            status: updateForm.status as
              | "committed"
              | "pending"
              | "confirmed"
              | "funded"
              | "transferred"
              | "liquidated"
              | "written_off",
          }
        : {}),
    });
  };

  const handleRecordFunding = () => {
    if (!selectedInvestment) return;
    const amount = parseFloat(fundAmount);
    if (!fundAmount || amount <= 0) {
      toast.error("Enter a valid funded amount");
      return;
    }
    recordFunding({
      investmentId: selectedInvestment.id,
      fundedAmount: amount,
    });
  };

  const handleCreateFromInterest = (interest: DealInterest) => {
    setCreateForm({
      userId: interest.userId,
      committedAmount: interest.proposedAmount || "",
      committedDate: new Date().toISOString().split("T")[0],
      ownershipPercentage: "",
    });
  };

  const interestedUsersWithoutInvestments = interests.filter(
    (interest) =>
      interest.status !== "pass" &&
      !investments.some((inv) => inv.userId === interest.userId),
  );

  const totalCommitted = investments.reduce((sum, inv) => {
    return sum + parseFloat(inv.committedAmount || "0");
  }, 0);

  const totalFunded = investments.reduce((sum, inv) => {
    return sum + parseFloat(inv.fundedAmount || "0");
  }, 0);

  const totalCurrentValue = investments.reduce((sum, inv) => {
    return sum + parseFloat(inv.currentValue || "0");
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 border-y border-border py-5 md:grid-cols-3">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total Committed
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalCommitted.toString())}
          </p>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total Funded
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalFunded.toString())}
          </p>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Current Value (NAV)
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalCurrentValue.toString())}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-5 border-y border-border py-5">
        <header>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold leading-none">
                Capital Commitments
              </h2>
              <p className="text-sm text-muted-foreground">
                Committed → Pending → Confirmed → Funded. Funding is recorded
                when capital is wired.
              </p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Commitment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Capital Commitment</DialogTitle>
                  <DialogDescription>
                    Record a commitment for an investor. Status starts as
                    Committed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userId">Investor *</Label>
                    <Select
                      value={createForm.userId}
                      onValueChange={(value) =>
                        setCreateForm({ ...createForm, userId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingInvestors ? (
                          <SelectItem value="loading" disabled>
                            Loading investors...
                          </SelectItem>
                        ) : (
                          investors.map((investor) => (
                            <SelectItem key={investor.id} value={investor.id}>
                              {investor.name} ({investor.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {interestedUsersWithoutInvestments.length > 0 ? (
                    <div>
                      <Label>Quick Create from Interest</Label>
                      <div className="mt-2 space-y-2">
                        {interestedUsersWithoutInvestments.map((interest) => (
                          <Button
                            key={interest.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleCreateFromInterest(interest)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={interest.user.image || undefined}
                                />
                                <AvatarFallback>
                                  {interest.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 text-left">
                                {interest.user.name} -{" "}
                                {formatCurrency(interest.proposedAmount)}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="committedAmount">Committed Amount *</Label>
                    <Input
                      id="committedAmount"
                      type="number"
                      placeholder="250000"
                      value={createForm.committedAmount}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          committedAmount: e.target.value,
                        })
                      }
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="committedDate">Committed Date *</Label>
                    <Input
                      id="committedDate"
                      type="date"
                      value={createForm.committedDate}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          committedDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownershipPercentage">
                      Ownership Percentage (Optional)
                    </Label>
                    <Input
                      id="ownershipPercentage"
                      type="number"
                      placeholder="2.5"
                      value={createForm.ownershipPercentage}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          ownershipPercentage: e.target.value,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setCreateForm({
                        userId: "",
                        committedAmount: "",
                        committedDate: new Date().toISOString().split("T")[0],
                        ownershipPercentage: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateInvestment}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Commitment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No capital commitments for this deal yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Committed</TableHead>
                  <TableHead>Funded</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Distributions</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Committed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={inv.user.image || undefined} />
                          <AvatarFallback>
                            {inv.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/compliance/investors/${inv.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {inv.user.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          investmentStatusColors[inv.status] ?? "secondary"
                        }
                      >
                        {investmentStatusLabels[inv.status] ??
                          inv.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(inv.committedAmount)}
                    </TableCell>
                    <TableCell>{formatCurrency(inv.fundedAmount)}</TableCell>
                    <TableCell>{formatCurrency(inv.currentValue)}</TableCell>
                    <TableCell>{formatCurrency(inv.distributions)}</TableCell>
                    <TableCell>
                      {formatPercentage(inv.ownershipPercentage)}
                    </TableCell>
                    <TableCell>{formatDate(inv.committedDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ADVANCE_LABEL[inv.status] ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdvancing}
                            onClick={() =>
                              advanceStatus({ investmentId: inv.id })
                            }
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            {ADVANCE_LABEL[inv.status]}
                          </Button>
                        ) : null}
                        {inv.status !== "funded" &&
                        inv.status !== "transferred" &&
                        inv.status !== "liquidated" &&
                        inv.status !== "written_off" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setFundAmount(
                                inv.fundedAmount || inv.committedAmount || "",
                              );
                              setIsFundDialogOpen(true);
                            }}
                          >
                            <DollarSign className="mr-1 h-3 w-3" />
                            Fund
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvestment(inv);
                            setIsUpdateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Funding</DialogTitle>
            <DialogDescription>
              Enter the amount wired. Status will move to Funded.
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedInvestment.user.name} —{" "}
                  {formatCurrency(selectedInvestment.committedAmount)} committed
                </p>
              </div>
              <div>
                <Label htmlFor="fundAmount">Funded Amount *</Label>
                <Input
                  id="fundAmount"
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFundDialogOpen(false);
                setSelectedInvestment(null);
                setFundAmount("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordFunding} disabled={isFunding}>
              {isFunding ? "Recording..." : "Record Funding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Investment</DialogTitle>
            <DialogDescription>
              Update NAV, distributions, ownership, or exit status. Use Advance
              / Fund actions for the commitment lifecycle.
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedInvestment.user.name} —{" "}
                  {formatCurrency(selectedInvestment.committedAmount)} committed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current Status:{" "}
                  {investmentStatusLabels[selectedInvestment.status] ??
                    selectedInvestment.status}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentValue">Current Value (NAV)</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    placeholder={selectedInvestment.currentValue || "0"}
                    value={updateForm.currentValue}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
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
                    value={updateForm.distributions}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
                        distributions: e.target.value,
                      })
                    }
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateForm.status}
                    onValueChange={(value) =>
                      setUpdateForm({ ...updateForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="committed">Committed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="funded">Funded</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="liquidated">Liquidated</SelectItem>
                      <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={updateForm.ownershipPercentage}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
                        ownershipPercentage: e.target.value,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateDialogOpen(false);
                setSelectedInvestment(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateInvestment} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

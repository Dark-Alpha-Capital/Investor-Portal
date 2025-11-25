"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Edit, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

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

type Investor = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  kycStatus: string;
  isOnboardingCompleted: boolean;
};

type InvestmentManagementProps = {
  dealId: string;
  investments: Investment[];
  interests: DealInterest[];
  onRefresh: () => void;
};

const investmentStatusColors: Record<string, string> = {
  committed: "secondary",
  active: "default",
  transferred: "secondary",
  liquidated: "default",
  written_off: "destructive",
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
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);

  // Form state for creating investment
  const [createForm, setCreateForm] = useState({
    userId: "",
    committedAmount: "",
    committedDate: new Date().toISOString().split("T")[0],
    ownershipPercentage: "",
  });

  // Form state for updating investment
  const [updateForm, setUpdateForm] = useState({
    fundedAmount: "",
    currentValue: "",
    distributions: "",
    status: "",
    ownershipPercentage: "",
  });

  useEffect(() => {
    if (isCreateDialogOpen) {
      fetchInvestors();
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (selectedInvestment && isUpdateDialogOpen) {
      setUpdateForm({
        fundedAmount: selectedInvestment.fundedAmount || "",
        currentValue: selectedInvestment.currentValue || "",
        distributions: selectedInvestment.distributions || "",
        status: selectedInvestment.status,
        ownershipPercentage: selectedInvestment.ownershipPercentage || "",
      });
    }
  }, [selectedInvestment, isUpdateDialogOpen]);

  const fetchInvestors = async () => {
    setIsLoadingInvestors(true);
    try {
      const response = await fetch("/api/investors");
      const data = await response.json();
      if (data.success) {
        setInvestors(data.investors || []);
      }
    } catch (error) {
      console.error("Error fetching investors:", error);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  const handleCreateInvestment = async () => {
    if (!createForm.userId || !createForm.committedAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealId,
          userId: createForm.userId,
          committedAmount: parseFloat(createForm.committedAmount),
          committedDate: createForm.committedDate,
          ownershipPercentage: createForm.ownershipPercentage
            ? parseFloat(createForm.ownershipPercentage)
            : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to create investment");
        return;
      }

      toast.success("Investment created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({
        userId: "",
        committedAmount: "",
        committedDate: new Date().toISOString().split("T")[0],
        ownershipPercentage: "",
      });
      onRefresh();
    } catch (error) {
      console.error("Error creating investment:", error);
      toast.error("Failed to create investment");
    }
  };

  const handleUpdateInvestment = async () => {
    if (!selectedInvestment) return;

    try {
      const updateData: any = {};

      if (updateForm.fundedAmount) {
        updateData.fundedAmount = parseFloat(updateForm.fundedAmount);
      }
      if (updateForm.currentValue) {
        updateData.currentValue = parseFloat(updateForm.currentValue);
      }
      if (updateForm.distributions) {
        updateData.distributions = parseFloat(updateForm.distributions);
      }
      if (updateForm.status) {
        updateData.status = updateForm.status;
      }
      if (updateForm.ownershipPercentage) {
        updateData.ownershipPercentage = parseFloat(
          updateForm.ownershipPercentage
        );
      }

      const response = await fetch(
        `/api/investments/${selectedInvestment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to update investment");
        return;
      }

      toast.success("Investment updated successfully");
      setIsUpdateDialogOpen(false);
      setSelectedInvestment(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating investment:", error);
      toast.error("Failed to update investment");
    }
  };

  const handleCreateFromInterest = (interest: DealInterest) => {
    setCreateForm({
      userId: interest.userId,
      committedAmount: interest.proposedAmount || "",
      committedDate: new Date().toISOString().split("T")[0],
      ownershipPercentage: "",
    });
    setIsCreateDialogOpen(true);
  };

  // Get users who have expressed interest but don't have investments yet
  const interestedUsersWithoutInvestments = interests.filter(
    (interest) =>
      interest.status !== "pass" &&
      !investments.some((inv) => inv.userId === interest.userId)
  );

  // Calculate totals
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommitted.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Funded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFunded.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current Value (NAV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue.toString())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Investment Dialog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investments</CardTitle>
              <CardDescription>
                Manage investments for this deal. Create investments after users
                sign commitment documents.
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Investment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Investment</DialogTitle>
                  <DialogDescription>
                    Record a new investment after the user has signed commitment
                    documents.
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

                  {/* Quick create from interests */}
                  {interestedUsersWithoutInvestments.length > 0 && (
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
                  )}

                  <div>
                    <Label htmlFor="committedAmount">Committed Amount *</Label>
                    <Input
                      id="committedAmount"
                      type="number"
                      placeholder="100000"
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage ownership in the deal
                    </p>
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
                  <Button onClick={handleCreateInvestment}>
                    Create Investment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No investments have been made in this deal yet.</p>
              <p className="text-sm mt-2">
                Create an investment after a user signs commitment documents.
              </p>
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
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={investment.user.image || undefined}
                          />
                          <AvatarFallback>
                            {investment.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/users/${investment.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {investment.user.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (investmentStatusColors[investment.status] as any) ||
                          "secondary"
                        }
                      >
                        {investment.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(investment.committedAmount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(investment.fundedAmount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(investment.currentValue)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(investment.distributions)}
                    </TableCell>
                    <TableCell>
                      {formatPercentage(investment.ownershipPercentage)}
                    </TableCell>
                    <TableCell>
                      {formatDate(investment.committedDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setIsUpdateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Investment Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Investment</DialogTitle>
            <DialogDescription>
              Update investment details. Leave fields empty to keep current
              values.
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedInvestment.user.name} -{" "}
                  {formatCurrency(selectedInvestment.committedAmount)} committed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current Status: {selectedInvestment.status.replace(/_/g, " ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fundedAmount">Funded Amount</Label>
                  <Input
                    id="fundedAmount"
                    type="number"
                    placeholder={selectedInvestment.fundedAmount || "0"}
                    value={updateForm.fundedAmount}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
                        fundedAmount: e.target.value,
                      })
                    }
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Amount actually wired. Status will auto-update to "active"
                    if amount &gt; 0.
                  </p>
                </div>

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
                  <p className="text-xs text-muted-foreground mt-1">
                    Net Asset Value - updated periodically
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Cash returned to investor
                  </p>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="liquidated">Liquidated</SelectItem>
                      <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="ownershipPercentage">
                    Ownership Percentage
                  </Label>
                  <Input
                    id="ownershipPercentage"
                    type="number"
                    placeholder={selectedInvestment.ownershipPercentage || "0"}
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
          )}
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
            <Button onClick={handleUpdateInvestment}>Update Investment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

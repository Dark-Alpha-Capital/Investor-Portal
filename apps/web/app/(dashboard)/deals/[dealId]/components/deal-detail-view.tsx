"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type UserInterest = {
  id: string;
  status: string;
  proposedAmount: string | null;
  createdAt: string;
  updatedAt: string | null;
} | null;

type UserInvestment = {
  id: string;
  committedAmount: string;
  fundedAmount: string | null;
  currentValue: string | null;
  distributions: string | null;
  status: string;
  ownershipPercentage: string | null;
  committedDate: string;
} | null;

type DealDetailViewProps = {
  dealId: string;
};

const statusColors: Record<string, string> = {
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
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

export function DealDetailView({ dealId }: DealDetailViewProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [userInterest, setUserInterest] = useState<UserInterest>(null);
  const [userInvestment, setUserInvestment] = useState<UserInvestment>(null);
  const [curationNote, setCurationNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoftCommitDialogOpen, setIsSoftCommitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposedAmount, setProposedAmount] = useState<string>("");

  useEffect(() => {
    fetchDealData();
  }, [dealId]);

  const fetchDealData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/view`);
      const data = await response.json();

      if (!data.success) {
        if (data.error === "Forbidden" || data.error === "Not Found") {
          toast.error(data.message || "Deal not found or access denied");
          router.push("/deals");
          return;
        }
        toast.error(data.message || "Failed to fetch deal");
        return;
      }

      setDeal(data.deal);
      setUserInterest(data.userInterest);
      setUserInvestment(data.userInvestment);
      setCurationNote(data.curationNote);

      if (data.userInterest) {
        setProposedAmount(data.userInterest.proposedAmount || "");
      }
    } catch (error) {
      console.error("Error fetching deal data:", error);
      toast.error("Failed to load deal data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpressInterest = async (
    status: "interested" | "soft_committed",
    amount?: number
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          proposedAmount: amount || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to express interest");
        setIsSubmitting(false);
        return;
      }

      toast.success("Interest sent – IR Team will contact you.");
      setUserInterest(data.interest);
      setIsSoftCommitDialogOpen(false);
      setProposedAmount("");
      fetchDealData(); // Refresh data
    } catch (error) {
      console.error("Error expressing interest:", error);
      toast.error("Failed to express interest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterestedClick = () => {
    handleExpressInterest("interested");
  };

  const handleSoftCommitSubmit = () => {
    if (!proposedAmount || parseFloat(proposedAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    handleExpressInterest("soft_committed", parseFloat(proposedAmount));
  };

  const handleUpdateStatus = async (
    status: "soft_committed" | "pass" | "meeting_requested",
    amount?: number
  ) => {
    if (status === "soft_committed" && (!amount || amount <= 0)) {
      toast.error("Please enter a valid amount for soft commit");
      return;
    }
    await handleExpressInterest(status, amount);
    setProposedAmount("");
  };

  const handlePassClick = () => {
    handleUpdateStatus("pass");
  };

  const handleMeetingRequestClick = () => {
    handleUpdateStatus("meeting_requested");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading deal details...
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Not Found</CardTitle>
          <CardDescription>
            The deal you're looking for doesn't exist or you don't have access
            to it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        {deal.coverImageUrl && (
          <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-t-xl">
            <img
              src={deal.coverImageUrl}
              alt={deal.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-3xl">{deal.name}</CardTitle>
                <Badge
                  variant={(statusColors[deal.status] as any) || "secondary"}
                >
                  {deal.status.replace(/_/g, " ")}
                </Badge>
              </div>
              {deal.teaserSummary && (
                <CardDescription className="text-base">
                  {deal.teaserSummary}
                </CardDescription>
              )}
              {curationNote && (
                <div className="mt-3 p-3 bg-muted rounded-md border-l-4 border-primary">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Curated for You</p>
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{curationNote}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {deal.description && (
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {deal.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* User Status Card */}
      {(userInterest || userInvestment) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userInvestment && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Active Investment</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Committed</p>
                    <p className="font-semibold">
                      {formatCurrency(userInvestment.committedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Funded</p>
                    <p className="font-semibold">
                      {formatCurrency(userInvestment.fundedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Value</p>
                    <p className="font-semibold">
                      {formatCurrency(userInvestment.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ownership</p>
                    <p className="font-semibold">
                      {formatPercentage(userInvestment.ownershipPercentage)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {userInterest && !userInvestment && (
              <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">
                      Interest Sent – IR Team will contact you.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status:{" "}
                      {interestStatusLabels[userInterest.status] ||
                        userInterest.status}
                      {userInterest.proposedAmount &&
                        ` • Amount: ${formatCurrency(userInterest.proposedAmount)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - Show when no interest or when user wants to update */}
      {!userInvestment && (
        <Card>
          <CardContent className="pt-6">
            {!userInterest ? (
              // Initial interest buttons
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleInterestedClick}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "I'm Interested"}
                </Button>
                <Dialog
                  open={isSoftCommitDialogOpen}
                  onOpenChange={setIsSoftCommitDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex-1" size="lg" variant="outline">
                      Soft Commit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Soft Commit</DialogTitle>
                      <DialogDescription>
                        Enter the amount you're interested in committing to this
                        deal
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
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
                        {deal.minInvestment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum investment:{" "}
                            {formatCurrency(deal.minInvestment)}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
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
                          isSubmitting ||
                          !proposedAmount ||
                          parseFloat(proposedAmount) <= 0
                        }
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              // Update status buttons
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Change your position on this deal:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Dialog
                    open={isSoftCommitDialogOpen}
                    onOpenChange={setIsSoftCommitDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1"
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          setProposedAmount(userInterest.proposedAmount || "");
                        }}
                      >
                        Soft Commit{" "}
                        {userInterest.proposedAmount &&
                          `(${formatCurrency(userInterest.proposedAmount)})`}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Soft Commit</DialogTitle>
                        <DialogDescription>
                          Enter the amount you're interested in committing to
                          this deal
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount-update">Amount</Label>
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
                              onChange={(e) =>
                                setProposedAmount(e.target.value)
                              }
                              min="0"
                              step="1000"
                            />
                          </div>
                          {deal.minInvestment && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Minimum investment:{" "}
                              {formatCurrency(deal.minInvestment)}
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
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
                              parseFloat(proposedAmount)
                            )
                          }
                          disabled={
                            isSubmitting ||
                            !proposedAmount ||
                            parseFloat(proposedAmount) <= 0
                          }
                        >
                          {isSubmitting ? "Submitting..." : "Update"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    className="flex-1"
                    size="lg"
                    variant="outline"
                    onClick={handleMeetingRequestClick}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Request Meeting"}
                  </Button>

                  <Button
                    className="flex-1"
                    size="lg"
                    variant="outline"
                    onClick={handlePassClick}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Pass"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deal Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Deal Type</p>
              <p className="font-medium">{deal.dealType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={(statusColors[deal.status] as any) || "secondary"}
              >
                {deal.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Categorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Sector</p>
              <p className="font-medium">{deal.sector || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geography</p>
              <p className="font-medium">{deal.geography || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Target Raise</p>
              <p className="font-medium text-lg">
                {formatCurrency(deal.targetRaise)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Minimum Investment
              </p>
              <p className="font-medium text-lg">
                {formatCurrency(deal.minInvestment)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target IRR</p>
              <p className="font-medium text-lg">
                {formatPercentage(deal.targetIrr)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target MOIC</p>
              <p className="font-medium text-lg">
                {deal.targetMoic
                  ? `${parseFloat(deal.targetMoic).toFixed(2)}x`
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Launch Date</p>
              <p className="font-medium">{formatDate(deal.launchDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Close Date</p>
              <p className="font-medium">{formatDate(deal.closeDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

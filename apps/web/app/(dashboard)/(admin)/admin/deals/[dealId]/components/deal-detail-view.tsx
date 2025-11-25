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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Target,
  TrendingUp,
  Users,
  FileText,
  Briefcase,
  Eye,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { InvestmentManagement } from "./investment-management";

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

type DealInvite = {
  id: string;
  userId: string;
  curationNote: string | null;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

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

type DealDetailViewProps = {
  dealId: string;
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

const interestStatusColors: Record<string, string> = {
  interested: "default",
  soft_committed: "default",
  pass: "destructive",
  meeting_requested: "default",
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

export function DealDetailView({ dealId }: DealDetailViewProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [invites, setInvites] = useState<DealInvite[]>([]);
  const [interests, setInterests] = useState<DealInterest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDealData();
  }, [dealId]);

  const fetchDealData = async () => {
    setIsLoading(true);
    try {
      // Fetch deal
      const dealResponse = await fetch(`/api/deals/${dealId}`);
      const dealData = await dealResponse.json();

      if (!dealData.success) {
        toast.error(dealData.message || "Failed to fetch deal");
        router.push("/admin/deals");
        return;
      }

      setDeal(dealData.deal);

      // Fetch related data in parallel
      const [invitesRes, interestsRes, investmentsRes] = await Promise.all([
        fetch(`/api/deals/${dealId}/invites`),
        fetch(`/api/deals/${dealId}/interests`),
        fetch(`/api/deals/${dealId}/investments`),
      ]);

      const invitesData = await invitesRes.json();
      const interestsData = await interestsRes.json();
      const investmentsData = await investmentsRes.json();

      if (invitesData.success) {
        setInvites(invitesData.invites);
      }
      if (interestsData.success) {
        setInterests(interestsData.interests);
      }
      if (investmentsData.success) {
        setInvestments(investmentsData.investments);
      }
    } catch (error) {
      console.error("Error fetching deal data:", error);
      toast.error("Failed to load deal data");
    } finally {
      setIsLoading(false);
    }
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
            The deal you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl">{deal.name}</CardTitle>
                <Badge variant={statusColors[deal.status] as any}>
                  {deal.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant={visibilityColors[deal.visibility] as any}>
                  {deal.visibility.replace(/_/g, " ")}
                </Badge>
              </div>
              {deal.teaserSummary && (
                <CardDescription className="text-base">
                  {deal.teaserSummary}
                </CardDescription>
              )}
            </div>
            {deal.coverImageUrl && (
              <img
                src={deal.coverImageUrl}
                alt={deal.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invited Investors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interested Investors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommitted.toString())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites.length})</TabsTrigger>
          <TabsTrigger value="interests">
            Interests ({interests.length})
          </TabsTrigger>
          <TabsTrigger value="investments">
            Investments ({investments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">Deal Name</p>
                  <p className="font-medium">{deal.name}</p>
                </div>
                {deal.slug && (
                  <div>
                    <p className="text-sm text-muted-foreground">Slug</p>
                    <p className="font-medium">{deal.slug}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Deal Type</p>
                  <p className="font-medium">{deal.dealType || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusColors[deal.status] as any}>
                    {deal.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <Badge variant={visibilityColors[deal.visibility] as any}>
                    {deal.visibility.replace(/_/g, " ")}
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
                  <p className="font-medium">
                    {formatCurrency(deal.targetRaise)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Minimum Investment
                  </p>
                  <p className="font-medium">
                    {formatCurrency(deal.minInvestment)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target IRR</p>
                  <p className="font-medium">
                    {formatPercentage(deal.targetIrr)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target MOIC</p>
                  <p className="font-medium">{deal.targetMoic || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
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
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(deal.createdAt)}</p>
                </div>
                {deal.updatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="font-medium">{formatDate(deal.updatedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invited Investors</CardTitle>
              <CardDescription>
                Investors who have been invited to view this deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No investors have been invited to this deal yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Curation Note</TableHead>
                      <TableHead>Invited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={invite.user.image || undefined}
                              />
                              <AvatarFallback>
                                {invite.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Link
                              href={`/admin/users/${invite.user.id}`}
                              className="font-medium hover:underline"
                            >
                              {invite.user.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>{invite.user.email}</TableCell>
                        <TableCell>
                          {invite.curationNote || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(invite.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interests Tab */}
        <TabsContent value="interests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interested Investors</CardTitle>
              <CardDescription>
                Investors who have expressed interest in this deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No investors have expressed interest in this deal yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Proposed Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interests.map((interest) => (
                      <TableRow key={interest.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={interest.user.image || undefined}
                              />
                              <AvatarFallback>
                                {interest.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Link
                              href={`/admin/users/${interest.user.id}`}
                              className="font-medium hover:underline"
                            >
                              {interest.user.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>{interest.user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              interestStatusColors[interest.status] as any
                            }
                          >
                            {interest.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(interest.proposedAmount)}
                        </TableCell>
                        <TableCell>{formatDate(interest.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-4">
          <InvestmentManagement
            dealId={dealId}
            investments={investments}
            interests={interests}
            onRefresh={fetchDealData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

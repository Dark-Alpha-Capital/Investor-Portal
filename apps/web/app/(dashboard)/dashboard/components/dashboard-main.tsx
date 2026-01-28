"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClearanceStatusCard } from "./clearance-status-card";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { ClearanceStatus } from "@/lib/permissions";

type PortfolioMetrics = {
  capitalCommitted: number;
  capitalDeployed: number;
  currentValue: number;
  totalInvestments: number;
};

type Investment = {
  id: string;
  dealId: string;
  dealName: string;
  committedAmount: string;
  fundedAmount: string;
  currentValue: string;
  distributions: string;
  status: string;
  committedDate: string;
  ownershipPercentage: string | null;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function DashboardMain() {
  const [portfolio, setPortfolio] = useState<PortfolioMetrics | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const trpc = useTRPC();

  // Fetch clearance status using tRPC
  const { data: clearanceData, isLoading: clearanceLoading } = useQuery(
    trpc.compliance.getMyClearance.queryOptions()
  );

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/investments/portfolio");
      const data = await response.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        setInvestments(data.investments || []);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract clearance status and conditions
  const clearanceStatus =
    (clearanceData?.clearance?.status as ClearanceStatus) ?? null;
  const clearanceConditions =
    (clearanceData?.clearance?.conditionsJson as string[]) ?? null;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
            <p className="text-muted-foreground text-base">
              Welcome to your investor portal
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile/edit-onboarding">
              <Button variant="secondary">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button variant="secondary">
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </Link>
          </div>
        </div>

        {/* Clearance Status Card - Full Width */}
        <div className="mb-8">
          {clearanceLoading ? (
            <Card className="p-7">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </Card>
          ) : (
            <ClearanceStatusCard
              status={clearanceStatus}
              conditions={clearanceConditions}
              isOnboardingCompleted={true}
            />
          )}
        </div>

        {/* Portfolio Metrics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-7">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Capital Committed</h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio?.capitalCommitted || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Money signed for
                </p>
              </>
            )}
          </Card>

          <Card className="p-7">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Capital Deployed</h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio?.capitalDeployed || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Money wired
                </p>
              </>
            )}
          </Card>

          <Card className="p-7">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Current Value</h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio?.currentValue || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">NAV</p>
              </>
            )}
          </Card>
        </div>

        {/* Investments List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Your Investments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-base mb-3">No investments yet</p>
                <Link
                  href="/deals"
                  className="text-primary hover:underline text-base font-medium inline-block"
                >
                  Browse investment opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-5 border-0 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{investment.dealName}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          Committed:{" "}
                          {formatCurrency(
                            parseFloat(investment.committedAmount)
                          )}
                        </span>
                        <span>
                          Deployed:{" "}
                          {formatCurrency(
                            parseFloat(investment.fundedAmount || "0")
                          )}
                        </span>
                        {investment.currentValue && (
                          <span>
                            Value:{" "}
                            {formatCurrency(
                              parseFloat(investment.currentValue)
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/deals/${investment.dealId}`}>
                      <Button variant="secondary" size="sm">
                        View Deal
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

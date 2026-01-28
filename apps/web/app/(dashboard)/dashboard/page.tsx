import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import {
  getUserWithKycAndClearance,
  getPortfolioData,
  getClearanceData,
} from "@repo/db/queries";
import type { ClearanceStatus } from "@/lib/permissions";
import { DashboardSkeleton } from "@/components/skeleton/dashboard-skeleton";
import { KycReviewScreen } from "./components/kyc-review";
import { KycPendingDocsScreen } from "./components/kyc-pending-docs";
import { KycRejectedScreen } from "./components/kyc-rejected";
import { OnboardingRequiredScreen } from "./components/onboarding-required";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClearanceStatusCard } from "./components/clearance-status-card";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Dashboard Main Presentational Component
 * Renders the main dashboard content with portfolio metrics and investments
 */
function DashboardMain({
  portfolioData,
  clearanceStatus,
  clearanceConditions,
}: {
  portfolioData: Awaited<ReturnType<typeof getPortfolioData>>;
  clearanceStatus: ClearanceStatus | null;
  clearanceConditions: string[] | null;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base">
              Overview of your investment portfolio and activity
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/edit-onboarding">
              <Button variant="secondary" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Clearance Status Card - Full Width */}
        <div className="mb-8">
          <ClearanceStatusCard
            status={clearanceStatus}
            conditions={clearanceConditions}
            isOnboardingCompleted={true}
          />
        </div>

        {/* Portfolio Metrics Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Capital Committed
                  </h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(portfolioData.portfolio.capitalCommitted)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total amount signed for
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Capital Deployed
                  </h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(portfolioData.portfolio.capitalDeployed)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total amount wired
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-md sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Current Value
                  </h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(portfolioData.portfolio.currentValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Net asset value (NAV)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investments List */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Your Investments
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {portfolioData.investments.length}{" "}
                  {portfolioData.investments.length === 1
                    ? "investment"
                    : "investments"}
                </p>
              </div>
              {portfolioData.investments.length > 0 && (
                <Link href="/deals">
                  <Button variant="ghost" size="sm">
                    View All Deals
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {portfolioData.investments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No investments yet
                </h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-sm">
                  Start building your portfolio by exploring available
                  investment opportunities
                </p>
                <Link href="/deals">
                  <Button>Browse Investment Opportunities</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioData.investments.map((investment) => (
                  <Link
                    key={investment.id}
                    href={`/deals/${investment.dealId}`}
                    className="block"
                  >
                    <div className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:bg-muted/30 hover:shadow-sm">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                          {investment.dealName}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">
                              Committed:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                parseFloat(investment.committedAmount),
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">
                              Deployed:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                parseFloat(investment.fundedAmount || "0"),
                              )}
                            </span>
                          </div>
                          {investment.currentValue && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">
                                Value:
                              </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(
                                  parseFloat(investment.currentValue),
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-4 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        View Deal
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Cached wrapper component that fetches dashboard data
 * Uses Next.js Cache Components pattern with cache directives
 */
async function FetchDashboardWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`dashboard-clearance-${userId}`);

  const [portfolioData, clearanceData] = await Promise.all([
    getPortfolioData(userId),
    getClearanceData(userId),
  ]);

  const clearanceStatus =
    (clearanceData.clearance?.status as ClearanceStatus) ?? null;
  const clearanceConditions =
    (clearanceData.clearance?.conditionsJson as string[]) ?? null;

  return (
    <DashboardMain
      portfolioData={portfolioData}
      clearanceStatus={clearanceStatus}
      clearanceConditions={clearanceConditions}
    />
  );
}

/**
 * Dashboard Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: DashboardContent logic wrapped in Suspense (streamed at request time)
 *
 * This component:
 * - Handles runtime data (session check)
 * - Calls cached data fetching function
 * - Renders the appropriate screen based on clearance/compliance status
 */
async function DashboardContent() {
  const session = await authSession();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get user data with KYC status and clearance data in a single query
  const userData = await getUserWithKycAndClearance(userId);

  if (!userData) {
    redirect("/login");
  }

  // If user hasn't completed onboarding, show onboarding required screen
  if (!userData.isOnboardingCompleted) {
    return <OnboardingRequiredScreen />;
  }

  // Get clearance/compliance status from the query result
  const clearanceStatus =
    (userData.clearanceStatus as ClearanceStatus) ?? "pending";

  // Render different screens based on clearance status
  switch (clearanceStatus) {
    case "cleared":
    case "cleared_with_conditions":
      // User is cleared, show full dashboard
      return <FetchDashboardWrapper userId={userId} />;
    case "rejected":
      // Clearance was rejected
      return <KycRejectedScreen />;
    case "pending":
    default:
      // Clearance is pending or no clearance record exists
      // Check if there are pending docs needed (this could be enhanced later)
      // For now, show review screen for pending clearance
      return <KycReviewScreen />;
  }
}

const DashboardPage = () => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;

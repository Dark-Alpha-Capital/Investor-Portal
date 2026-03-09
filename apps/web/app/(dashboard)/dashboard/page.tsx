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
import { DollarSign, TrendingUp, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

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
  const clearanceLabel =
    clearanceStatus === "cleared"
      ? "Cleared"
      : clearanceStatus === "cleared_with_conditions"
        ? "Cleared with Conditions"
        : clearanceStatus === "pending"
          ? "Under Review"
          : clearanceStatus === "rejected"
            ? "Rejected"
            : "Pending";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
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
        </header>

        <section className="mb-10 border-y border-border py-4" aria-label="Clearance status">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-muted-foreground">Clearance Status</p>
            <p className="text-sm font-semibold text-foreground">{clearanceLabel}</p>
          </div>
          {clearanceConditions && clearanceConditions.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Conditions: {clearanceConditions.join(", ")}
            </p>
          )}
        </section>

        <section className="mb-10 border-y border-border py-2" aria-label="Portfolio metrics">
          <dl className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-border">
            <div className="space-y-2 py-5 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Capital Committed
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(portfolioData.portfolio.capitalCommitted)}
              </dd>
              <p className="text-xs text-muted-foreground">Total amount signed for</p>
            </div>

            <div className="space-y-2 border-t border-border py-5 md:border-t-0 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Capital Deployed
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(portfolioData.portfolio.capitalDeployed)}
              </dd>
              <p className="text-xs text-muted-foreground">Total amount wired</p>
            </div>

            <div className="space-y-2 border-t border-border py-5 md:border-t-0 md:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Current Value
              </dt>
              <dd className="text-3xl font-semibold tracking-tight">
                {formatCurrency(portfolioData.portfolio.currentValue)}
              </dd>
              <p className="text-xs text-muted-foreground">Net asset value (NAV)</p>
            </div>
          </dl>
        </section>

        <section aria-label="Investments">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Investments</h2>
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
          </div>

          {portfolioData.investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-8 w-8 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No investments yet</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Start building your portfolio by exploring available investment
                opportunities
              </p>
              <Link href="/deals">
                <Button>Browse Investment Opportunities</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {portfolioData.investments.map((investment) => (
                <Link
                  key={investment.id}
                  href={`/deals/${investment.dealId}`}
                  className="group block py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-base font-semibold transition-colors group-hover:text-primary">
                        {investment.dealName}
                      </h3>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Committed:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(parseFloat(investment.committedAmount))}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Deployed:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(
                              parseFloat(investment.fundedAmount || "0"),
                            )}
                          </span>
                        </p>
                        {investment.currentValue && (
                          <p className="text-muted-foreground">
                            Value:{" "}
                            <span className="font-medium text-foreground">
                              {formatCurrency(parseFloat(investment.currentValue))}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-fit">
                      View Deal
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
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

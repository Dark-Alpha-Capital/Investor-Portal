import "server-only";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { getUserWithKycStatus } from "@repo/db/queries";
import { KycReviewScreen } from "./kyc-review";
import { KycPendingDocsScreen } from "./kyc-pending-docs";
import { KycRejectedScreen } from "./kyc-rejected";
import { DashboardMain } from "./dashboard-main";

/**
 * Server component that handles runtime data (session).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (session) and calls a cached async function.
 */
export async function DashboardContent() {
  // Auth check - runtime data access
  const session = await authSession();

  if (!session) {
    console.log("User is not logged in");
    redirect("/login");
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading dashboard...
          </div>
        </div>
      }
    >
      <FetchDashboardWrapper userId={userId} />
    </Suspense>
  );
}

async function FetchDashboardWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`dashboard-user-${userId}`);

  const userData = await getUserWithKycStatus(userId);

  if (!userData) {
    redirect("/login");
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!userData.isOnboardingCompleted) {
    redirect("/onboarding");
  }

  // Render different screens based on KYC status
  const kycStatus = userData.kycStatus;
  switch (kycStatus) {
    case "review":
      return <KycReviewScreen />;
    case "pending_docs":
      return <KycPendingDocsScreen />;
    case "rejected":
      return <KycRejectedScreen />;
    case "approved":
      return <DashboardMain />;
    default:
      // Default to review screen if status is unknown or null
      return <KycReviewScreen />;
  }
}

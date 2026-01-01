import { Suspense } from "react";
import { DashboardContent } from "./components/dashboard-content";
import { DashboardSkeleton } from "@/components/skeleton/dashboard-skeleton";

/**
 * Dashboard Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: DashboardContent wrapped in Suspense (streamed at request time)
 *
 * The DashboardContent component:
 * - Handles runtime data (session check)
 * - Calls cached data fetching function
 * - Renders the appropriate screen based on KYC status
 */
const DashboardPage = () => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;

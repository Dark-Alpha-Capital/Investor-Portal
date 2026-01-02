import { Suspense } from "react";
import { ComplianceDashboardContent } from "./components/compliance-dashboard-content";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  clearanceStatus?: string;
}>;

/**
 * Compliance Dashboard Page
 *
 * Allows admins to review investor KYC submissions and manage clearance status.
 */
export default function CompliancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance & Clearance
        </h1>
        <p className="text-muted-foreground mt-2">
          Review investor KYC submissions and manage clearance status
        </p>
      </div>

      {/* Dynamic content - streamed at request time */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading compliance data...
            </div>
          </div>
        }
      >
        <ComplianceDashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

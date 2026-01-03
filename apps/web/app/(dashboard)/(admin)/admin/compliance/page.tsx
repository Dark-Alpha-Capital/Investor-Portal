import { Suspense } from "react";
import { ShieldCheck, Lock, Building2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance & Clearance
        </h1>
        <p className="text-muted-foreground mt-2">
          Review investor KYC submissions and manage clearance status
        </p>
      </div>

      {/* KYC Gate Info Banner */}
      <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="h-4 w-4 !text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">
          KYC-Gated Deal Marketplace
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Pending / No Clearance</p>
                <p className="text-xs opacity-80">
                  Investor cannot see any deals in the marketplace
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Cleared</p>
                <p className="text-xs opacity-80">
                  Permissions auto-granted for all non-draft deals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Per-Deal Permissions</p>
                <p className="text-xs opacity-80">
                  Manage specific access via investor detail page
                </p>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

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

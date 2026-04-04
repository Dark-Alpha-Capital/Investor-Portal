import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchComplianceListData } from "@/lib/server-fns/admin-route-data";
import { ShieldCheck, Lock, Building2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ComplianceTableClient } from "@/components/compliance-table-client";

type PendingPayload = Awaited<
  ReturnType<typeof import("@repo/db/queries").getPendingInvestors>
>;

export const Route = createFileRoute("/(dashboard)/(admin)/admin/compliance/")({
  loader: async ({ location }: { location: { search: string } }) => {
    const r = await fetchComplianceListData({
      data: { search: location.search },
    });
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return {
      initialData: r.initialData,
      clearanceStatus: r.clearanceStatus,
    };
  },
  component: ComplianceListRoutePage,
});

function ComplianceListRoutePage() {
  const { initialData, clearanceStatus } = Route.useLoaderData();
  return (
    <ComplianceListInner
      initialData={initialData}
      initialClearanceStatus={clearanceStatus}
    />
  );
}

function ComplianceListInner({
  initialData,
  initialClearanceStatus,
}: {
  initialData: PendingPayload;
  initialClearanceStatus: string;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance & Clearance
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review investor KYC submissions and manage clearance status
        </p>
      </div>

      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <Info className="h-4 w-4 !text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">
          KYC-Gated Deal Marketplace
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <div className="mt-2 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Pending / No Clearance</p>
                <p className="text-xs opacity-80">
                  Investor cannot see any deals in the marketplace
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Cleared</p>
                <p className="text-xs opacity-80">
                  Permissions auto-granted for all non-draft deals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
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

      <ComplianceTableClient
        initialData={initialData}
        initialClearanceStatus={initialClearanceStatus}
      />
    </div>
  );
}

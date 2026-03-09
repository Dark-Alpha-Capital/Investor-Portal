import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

type DealAccessDeniedProps = {
  clearanceStatus: string | null;
  reason?: string;
};

export function DealAccessDenied({
  clearanceStatus,
  reason,
}: DealAccessDeniedProps) {
  const isClearedWithConditions = clearanceStatus === "cleared_with_conditions";
  const isPending = clearanceStatus === "pending";
  const isRejected = clearanceStatus === "rejected";
  const isNotCleared = !clearanceStatus || clearanceStatus === "not_cleared";

  return (
    <div className="space-y-6">
      <section className="border-destructive/50">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <ShieldX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl">Access Denied</h3>
              <p>
                You don't have permission to view this deal
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deal Not Accessible</AlertTitle>
            <AlertDescription>
              {reason ||
                "This deal is currently not available for your account. Please contact support if you believe this is an error."}
            </AlertDescription>
          </Alert>

          {isClearedWithConditions && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Clearance Status: Cleared with Conditions</AlertTitle>
              <AlertDescription>
                You have been cleared with conditions. However, you don't have
                specific permission to view this deal. Please contact the
                compliance team or your relationship manager for access.
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Clearance Status: Pending</AlertTitle>
              <AlertDescription>
                Your compliance clearance is still pending review. Once cleared,
                you'll be able to access deals. Please check your dashboard for
                updates.
              </AlertDescription>
            </Alert>
          )}

          {isRejected && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Clearance Status: Rejected</AlertTitle>
              <AlertDescription>
                Your compliance clearance was not approved. Please contact the
                compliance team for more information about your status.
              </AlertDescription>
            </Alert>
          )}

          {isNotCleared && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Clearance Required</AlertTitle>
              <AlertDescription>
                You need to be cleared by compliance before accessing deals.
                Please complete your onboarding and wait for clearance approval.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" asChild>
              <Link href="/deals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deals
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

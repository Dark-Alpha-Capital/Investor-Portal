import { AppLink as Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX, ArrowLeft, AlertTriangle, FileQuestion } from "lucide-react";

type DealAccessDeniedProps = {
  clearanceStatus: string | null;
  reason?: string;
};

export function DealAccessDenied({
  clearanceStatus,
  reason,
}: DealAccessDeniedProps) {
  const isPending = clearanceStatus === "pending_review";
  const isNeedsInfo = clearanceStatus === "needs_information";
  const isRejected = clearanceStatus === "rejected";
  const isApproved = clearanceStatus === "approved";
  const hasNoStatus = !clearanceStatus;

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
              <p>You don&apos;t have access to this deal</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deal Not Accessible</AlertTitle>
            <AlertDescription>
              {reason ||
                "This deal is not available for your account. Please contact support if you believe this is an error."}
            </AlertDescription>
          </Alert>

          {isApproved && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not Invited</AlertTitle>
              <AlertDescription>
                Your account is approved, but you have not been invited to this
                deal. Contact your relationship manager if you need access.
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Status: Pending Review</AlertTitle>
              <AlertDescription>
                Your KYC is still under review. Once approved, you can be
                invited to deals.
              </AlertDescription>
            </Alert>
          )}

          {isNeedsInfo && (
            <Alert>
              <FileQuestion className="h-4 w-4" />
              <AlertTitle>Status: Needs Information</AlertTitle>
              <AlertDescription>
                Additional information is required before approval. Check your
                dashboard for details.
              </AlertDescription>
            </Alert>
          )}

          {isRejected && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Status: Rejected</AlertTitle>
              <AlertDescription>
                Your account was not approved. Please contact the compliance
                team for more information.
              </AlertDescription>
            </Alert>
          )}

          {hasNoStatus && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Approval Required</AlertTitle>
              <AlertDescription>
                Complete onboarding and wait for approval before accessing
                deals.
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

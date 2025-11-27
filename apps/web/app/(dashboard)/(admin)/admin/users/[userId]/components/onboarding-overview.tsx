import { format } from "date-fns";
import { getOnboardingStatusBadge, getKycStatusBadge } from "./utils";
import { Separator } from "@/components/ui/separator";

interface OnboardingOverviewProps {
  onboarding: {
    status: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
  };
  user: {
    id: string;
    kycStatus: string | null;
  };
  documentsCount: number;
}

export function OnboardingOverview({
  onboarding,
  user,
  documentsCount,
}: OnboardingOverviewProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 py-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          {getOnboardingStatusBadge(onboarding.status)}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Documents</p>
          <p className="text-sm font-medium">{documentsCount}</p>
        </div>
      </div>

      {(onboarding.submittedAt || onboarding.reviewedAt) && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4 py-2">
            {onboarding.submittedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                <p className="text-sm font-medium">
                  {format(new Date(onboarding.submittedAt), "PPP")}
                </p>
              </div>
            )}
            {onboarding.reviewedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reviewed</p>
                <p className="text-sm font-medium">
                  {format(new Date(onboarding.reviewedAt), "PPP")}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {onboarding.reviewNotes && (
        <>
          <Separator />
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1">Review Notes</p>
            <p className="text-sm bg-muted/50 px-3 py-2 rounded">
              {onboarding.reviewNotes}
            </p>
          </div>
        </>
      )}

      <Separator />

      <div className="py-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">KYC Status</p>
          {getKycStatusBadge(user.kycStatus)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Application status can be updated from the header above.
        </p>
      </div>
    </div>
  );
}

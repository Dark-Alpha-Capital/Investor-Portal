import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileQuestion,
} from "lucide-react";
import { AppLink as Link } from "@/components/app-link";
import type { ClearanceStatus } from "@/lib/auth/permissions";

type ClearanceStatusCardProps = {
  status: ClearanceStatus | null;
  conditions: string[] | null;
  isOnboardingCompleted: boolean;
};

const statusConfig = {
  pending_review: {
    icon: Clock,
    label: "Pending Review",
    description: "Your KYC is being reviewed by our compliance team.",
    variant: "secondary" as const,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  approved: {
    icon: ShieldCheck,
    label: "Approved",
    description: "You are eligible to invest. Deals appear when you are invited.",
    variant: "default" as const,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  needs_information: {
    icon: FileQuestion,
    label: "Needs Information",
    description: "Additional documents or corrections are required.",
    variant: "secondary" as const,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    description: "Your application was not approved.",
    variant: "destructive" as const,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
} as const;

export function ClearanceStatusCard({
  status,
  conditions,
  isOnboardingCompleted,
}: ClearanceStatusCardProps) {
  if (!isOnboardingCompleted) {
    return (
      <section className="border-l-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800/50">
        <div className="pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-lg font-semibold">Complete Your Onboarding</h3>
              <p className="text-sm">
                Finish your investor profile to access deal opportunities
              </p>
            </div>
          </div>
        </div>
        <div className="pt-0">
          <p className="text-sm text-muted-foreground mb-5">
            Complete the onboarding process to gain access to the deal
            marketplace and investment opportunities.
          </p>
          <Button asChild>
            <Link href="/onboarding">
              Continue Onboarding
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const currentStatus = status ?? "pending_review";
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <section
      className={`relative overflow-hidden border-l-4 border-border/50 ${config.bgColor}`}
      style={{ borderLeftColor: "currentColor" }}
    >
      <div className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
            >
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Investor Status</h3>
              <p className="text-sm">{config.description}</p>
            </div>
          </div>
          <Badge variant={config.variant} className="shrink-0">
            {config.label}
          </Badge>
        </div>
      </div>
      <div className="space-y-4 pt-0">
        {currentStatus === "pending_review" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Our compliance team typically reviews applications within 2-3
              business days. You&apos;ll receive an email notification once your
              status is updated.
            </AlertDescription>
          </Alert>
        )}

        {currentStatus === "approved" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Once invited to a deal, you can:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Review teasers and data rooms
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Express interest and commit capital
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Manage your portfolio
              </li>
            </ul>
          </div>
        )}

        {currentStatus === "needs_information" && (
          <div className="space-y-2">
            <Alert>
              <FileQuestion className="h-4 w-4" />
              <AlertDescription>
                Please provide the requested information so we can complete your
                review.
              </AlertDescription>
            </Alert>
            {conditions && conditions.length > 0 && (
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                {conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {currentStatus === "rejected" && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your application did not meet our compliance requirements.
                Please contact our compliance team for more information.
              </AlertDescription>
            </Alert>
            <Button variant="secondary" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

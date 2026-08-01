import { format } from "date-fns";
import { AppLink as Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Pencil,
  History,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  XCircle,
  FileQuestion,
  MessageSquare,
} from "lucide-react";
import type { ClearanceStatus } from "@/lib/auth/permissions";
import type { OnboardingClearanceSummary } from "@/lib/server-fns/onboarding-route-data.server";

type EditHistoryEntry = {
  id: string;
  fieldName: string;
  fieldLabel: string | null;
  previousValue: string | null;
  newValue: string | null;
  editedAt: Date;
};

type OnboardingCompleteViewProps = {
  onboardingData: {
    id: string;
    submittedAt: Date | null;
    lastEditedAt: Date | null;
    editCount: string | null;
    isEditable: boolean | null;
    organizationName: string | null;
  };
  editHistory: EditHistoryEntry[];
  clearance: OnboardingClearanceSummary;
};

const statusConfig: Record<
  ClearanceStatus,
  {
    icon: typeof CheckCircle2;
    title: string;
    subtitle: (name: string) => string;
    badgeLabel: string;
    badgeVariant: "default" | "secondary" | "destructive";
    iconBg: string;
    iconColor: string;
    info: string;
  }
> = {
  pending_review: {
    icon: Clock,
    title: "Application Under Review",
    subtitle: (name) =>
      `${name} has been submitted and is awaiting compliance review`,
    badgeLabel: "Pending Review",
    badgeVariant: "secondary",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    info: "Your application has been submitted and can no longer be edited. Our compliance team typically reviews applications within 1–2 business days. You'll be notified once your status is updated.",
  },
  approved: {
    icon: ShieldCheck,
    title: "Application Approved",
    subtitle: (name) =>
      `${name} has been approved. You are eligible to invest when invited.`,
    badgeLabel: "Approved",
    badgeVariant: "default",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    info: "Your KYC has been approved. Deals appear in the marketplace when you are invited. Contact support if you need to update your profile information.",
  },
  needs_information: {
    icon: FileQuestion,
    title: "Additional Information Required",
    subtitle: (name) =>
      `${name} needs additional documents or corrections before approval`,
    badgeLabel: "Needs Information",
    badgeVariant: "secondary",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    info: "Please review the notes below and provide the requested information. Contact support to submit updates.",
  },
  rejected: {
    icon: XCircle,
    title: "Application Not Approved",
    subtitle: (name) =>
      `${name} was not approved for participation at this time`,
    badgeLabel: "Rejected",
    badgeVariant: "destructive",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    info: "Your application did not meet our compliance requirements. Please contact support if you have questions or believe this was made in error.",
  },
};

function StatusActions({ status }: { status: ClearanceStatus }) {
  switch (status) {
    case "approved":
      return (
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      );
    case "pending_review":
      return (
        <Button asChild variant="secondary">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      );
    case "needs_information":
    case "rejected":
      return (
        <>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:support@darkalphacapital.com">Contact Support</a>
          </Button>
        </>
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function OnboardingCompleteView({
  onboardingData,
  editHistory,
  clearance,
}: OnboardingCompleteViewProps) {
  const editCount = parseInt(onboardingData.editCount || "0", 10);
  const profileName = onboardingData.organizationName || "Your profile";
  const config = statusConfig[clearance.status];
  const StatusIcon = config.icon;
  const hasNotes = Boolean(clearance.investorVisibleNotes?.trim());
  const hasConditions =
    clearance.conditions != null && clearance.conditions.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl space-y-6">
      <section>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${config.iconBg}`}>
                <StatusIcon className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl">{config.title}</h3>
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {config.badgeLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {config.subtitle(profileName)}
                </p>
              </div>
            </div>
            {editCount > 0 ? (
              <Badge variant="secondary" className="text-xs shrink-0">
                {editCount} edit{editCount !== 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {onboardingData.submittedAt ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Submitted:{" "}
                  {format(
                    new Date(onboardingData.submittedAt),
                    "MMM d, yyyy",
                  )}
                </span>
              </div>
            ) : null}
            {clearance.clearedAt ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Reviewed:{" "}
                  {format(new Date(clearance.clearedAt), "MMM d, yyyy")}
                </span>
              </div>
            ) : null}
            {onboardingData.lastEditedAt ? (
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                <span>
                  Last edited:{" "}
                  {format(
                    new Date(onboardingData.lastEditedAt),
                    "MMM d, yyyy h:mm a",
                  )}
                </span>
              </div>
            ) : null}
          </div>

          {hasNotes || hasConditions ? (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Notes from compliance
              </div>
              {hasNotes ? (
                <p className="text-sm whitespace-pre-wrap">
                  {clearance.investorVisibleNotes}
                </p>
              ) : null}
              {hasConditions ? (
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  {clearance.conditions!.map((condition) => (
                    <li key={condition}>{condition}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <StatusActions status={clearance.status} />
          </div>

          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {config.info}
          </p>
        </div>
      </section>

      {editHistory.length > 0 ? (
        <section>
          <div>
            <h3 className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Edit History
            </h3>
            <p>Your most recent changes to the onboarding form</p>
          </div>
          <div>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-3">
                {editHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {entry.fieldLabel || entry.fieldName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-muted-foreground line-through bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {entry.previousValue || "(empty)"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded truncate max-w-[150px] font-medium">
                            {entry.newValue || "(empty)"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.editedAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {editHistory.length >= 10 ? (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Showing the 10 most recent changes
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

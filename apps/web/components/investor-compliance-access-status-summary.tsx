import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Lock,
  Building2,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Clearance = {
  status: string;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
} | null;

type Invitation = {
  id: string;
  dealId: string;
  dealName: string;
  accessLevel?: "teaser" | "data_room";
};

type AccessStatusSummaryProps = {
  clearance: Clearance;
  permissions: Invitation[];
  isOnboardingCompleted: boolean;
};

export function AccessStatusSummary({
  clearance,
  permissions,
  isOnboardingCompleted,
}: AccessStatusSummaryProps) {
  const clearanceStatus = clearance?.status ?? null;
  const isApproved = clearanceStatus === "approved";
  const isRejected = clearanceStatus === "rejected";
  const isPending =
    clearanceStatus === "pending_review" || !clearance;
  const needsInfo = clearanceStatus === "needs_information";

  const totalInvitations = permissions.length;
  const dataRoomCount = permissions.filter(
    (p) => p.accessLevel === "data_room"
  ).length;
  const teaserCount = permissions.filter(
    (p) => p.accessLevel === "teaser"
  ).length;

  const getAccessLevel = () => {
    if (isRejected) {
      return {
        icon: <ShieldX className="h-5 w-5 text-red-600" />,
        color:
          "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        label: "Rejected",
        description: "Investor cannot participate",
      };
    }
    if (needsInfo) {
      return {
        icon: <FileQuestion className="h-5 w-5 text-amber-600" />,
        color:
          "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
        textColor: "text-amber-800 dark:text-amber-200",
        label: "Needs Information",
        description: "Additional documents or corrections required",
      };
    }
    if (isPending) {
      return {
        icon: <ShieldAlert className="h-5 w-5 text-amber-600" />,
        color:
          "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
        textColor: "text-amber-800 dark:text-amber-200",
        label: "Pending Review",
        description: "Investor cannot see deals until approved",
      };
    }
    if (isApproved && totalInvitations > 0) {
      return {
        icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
        color:
          "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        label: "Approved",
        description: `Invited to ${totalInvitations} deal(s)`,
      };
    }
    if (isApproved) {
      return {
        icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
        color:
          "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        label: "Approved (No Invitations)",
        description: "Approved but not yet invited to any deals",
      };
    }
    return {
      icon: <Lock className="h-5 w-5 text-gray-600" />,
      color:
        "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800",
      textColor: "text-gray-800 dark:text-gray-200",
      label: "Unknown",
      description: "Status could not be determined",
    };
  };

  const access = getAccessLevel();

  return (
    <div className="space-y-4">
      <section
        className={`flex flex-col gap-4 rounded-lg border-2 p-4 ${access.color}`}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-none">
          {access.icon}
          {access.label}
        </h2>
        <p className={`text-sm ${access.textColor}`}>{access.description}</p>

        {isApproved && (
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1">
              <Building2 className="h-3 w-3" />
              {totalInvitations} invitation(s)
            </Badge>
            <Badge variant="outline">{teaserCount} teaser</Badge>
            <Badge variant="outline">{dataRoomCount} data room</Badge>
          </div>
        )}
      </section>

      {!isOnboardingCompleted && (
        <Alert>
          <AlertTitle>Onboarding incomplete</AlertTitle>
          <AlertDescription>
            Investor must complete KYC before they can be approved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

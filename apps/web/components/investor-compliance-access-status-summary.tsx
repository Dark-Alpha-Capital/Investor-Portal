
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Lock,
  Building2,
  Eye,
  FileText,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Clearance = {
  status: string;
  conditions: string | null;
  conditionsJson: string[] | null;
  clearedAt: Date | null;
} | null;

type VehiclePermission = {
  id: string;
  dealId: string;
  dealName: string;
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
};

type AccessStatusSummaryProps = {
  clearance: Clearance;
  permissions: VehiclePermission[];
  isOnboardingCompleted: boolean;
};

export function AccessStatusSummary({
  clearance,
  permissions,
  isOnboardingCompleted,
}: AccessStatusSummaryProps) {
  const clearanceStatus = clearance?.status ?? null;
  const isCleared =
    clearanceStatus === "cleared" ||
    clearanceStatus === "cleared_with_conditions";
  const isRejected = clearanceStatus === "rejected";
  const isPending = clearanceStatus === "pending";
  const hasNoClearance = !clearance;

  // Calculate permission stats
  const totalDeals = permissions.length;
  const dealsWithDocAccess = permissions.filter((p) => p.canViewDocuments).length;
  const dealsWithInvestAccess = permissions.filter((p) => p.canInvest).length;

  // Determine access level
  const getAccessLevel = () => {
    if (isRejected) {
      return {
        level: "blocked",
        icon: <ShieldX className="h-5 w-5 text-red-600" />,
        color: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        label: "No Access",
        description: "Investor is blocked from accessing any deals",
      };
    }
    if (hasNoClearance || isPending) {
      return {
        level: "pending",
        icon: <ShieldAlert className="h-5 w-5 text-amber-600" />,
        color: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
        textColor: "text-amber-800 dark:text-amber-200",
        label: "Pending Clearance",
        description: "Investor cannot see any deals until cleared",
      };
    }
    if (isCleared && totalDeals > 0) {
      return {
        level: "active",
        icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
        color: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        label: clearanceStatus === "cleared" ? "Full Access" : "Conditional Access",
        description:
          clearanceStatus === "cleared"
            ? "Investor has full access to granted deals"
            : "Investor has restricted access based on conditions",
      };
    }
    if (isCleared && totalDeals === 0) {
      return {
        level: "cleared_no_deals",
        icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
        color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        label: "Cleared (No Deals)",
        description: "Investor is cleared but has no deal permissions yet",
      };
    }
    return {
      level: "unknown",
      icon: <Lock className="h-5 w-5 text-gray-600" />,
      color: "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800",
      textColor: "text-gray-800 dark:text-gray-200",
      label: "Unknown",
      description: "Access status could not be determined",
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
          <span className={access.textColor}>Deal Marketplace Access</span>
        </h2>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <Badge
              variant={
                access.level === "active"
                  ? "default"
                  : access.level === "blocked"
                    ? "destructive"
                    : "secondary"
              }
              className="text-sm px-3 py-1"
            >
              {access.label}
            </Badge>
            <span className={`text-sm ${access.textColor}`}>
              {access.description}
            </span>
          </div>

          {/* Pre-clearance warning */}
          {!isCleared && !isRejected && (
            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 !text-amber-600" />
              <AlertTitle>KYC Gate Active</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                This investor <strong>cannot see any deals</strong> in the marketplace until they are cleared.
                {!isOnboardingCompleted && (
                  <> They also have not completed onboarding yet.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Deal Access Stats - Only show if cleared */}
          {isCleared && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{totalDeals}</span>
                </div>
                <p className="text-xs text-muted-foreground">Deals Visible</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{dealsWithDocAccess}</span>
                </div>
                <p className="text-xs text-muted-foreground">Doc Access</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{dealsWithInvestAccess}</span>
                </div>
                <p className="text-xs text-muted-foreground">Can Invest</p>
              </div>
            </div>
          )}

          {/* Conditions display */}
          {clearanceStatus === "cleared_with_conditions" &&
            clearance?.conditionsJson &&
            clearance.conditionsJson.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2 text-amber-800 dark:text-amber-200">
                  Active Conditions:
                </p>
                <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {clearance.conditionsJson.map((condition, i) => (
                    <li key={i}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </section>

      {/* Info box explaining the system */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <Eye className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">How Access Control Works</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>
                Investors must be <strong>cleared</strong> to see any deals in the marketplace
              </li>
              <li>
                When cleared, permissions are auto-granted for all non-draft deals
              </li>
              <li>
                Use the <strong>Permissions</strong> tab to add/revoke access to specific deals
              </li>
              <li>
                Each deal has 4 permission levels: View Teaser, View Docs, Express Interest, Invest
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

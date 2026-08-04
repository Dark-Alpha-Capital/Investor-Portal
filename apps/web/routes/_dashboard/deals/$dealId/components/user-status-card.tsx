import { CheckCircle2, FileText, DollarSign, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { INVESTMENT_STATUS_LABELS } from "@repo/db/investment-closing";

type UserInterest = {
  id: string;
  status: string;
  proposedAmount: string | null;
  createdAt: string;
  updatedAt: string | null;
} | null;

type UserInvestment = {
  id: string;
  committedAmount: string;
  fundedAmount: string | null;
  currentValue: string | null;
  distributions: string | null;
  status: string;
  ownershipPercentage: string | null;
  committedDate: string;
} | null;

type DealPermissions = {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  isAdminPreview?: boolean;
  accessLevel?: "teaser" | "data_room" | null;
};

type UserStatusCardProps = {
  userInterest: UserInterest;
  userInvestment: UserInvestment;
  permissions: DealPermissions;
};

const interestStatusLabels: Record<string, string> = {
  interested: "Interested",
  soft_committed: "Interested",
  pass: "Passed",
  meeting_requested: "Interested",
};

/** Investor-facing closing / portfolio status label. */
function investorCommitmentLabel(status: string): string {
  return INVESTMENT_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
};

const stat = (label: string, value: string) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
  </div>
);

export function UserStatusCard({
  userInterest,
  userInvestment,
  permissions,
}: UserStatusCardProps) {
  const isFunded = userInvestment?.status === "funded";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Your Status</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {permissions.isAdminPreview ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            <Eye className="h-3 w-3" />
            Admin preview
          </div>
        ) : (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              permissions.accessLevel === "data_room"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : permissions.accessLevel === "teaser"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            <Eye className="h-3 w-3" />
            {permissions.accessLevel === "data_room"
              ? "Data Room Access"
              : permissions.accessLevel === "teaser"
                ? "Teaser Access"
                : "No Access"}
          </div>
        )}
        {permissions.canViewDocuments && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <FileText className="h-3 w-3" />
            Documents
          </div>
        )}
        {permissions.canInvest && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <DollarSign className="h-3 w-3" />
            Can Commit
          </div>
        )}
      </div>

      {userInvestment ? (
        <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Capital Commitment</span>
            <Badge variant={isFunded ? "default" : "secondary"}>
              {investorCommitmentLabel(userInvestment.status)}
            </Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 text-sm md:grid-cols-4">
            {stat("Committed", formatCurrency(userInvestment.committedAmount))}
            {isFunded
              ? stat("Funded", formatCurrency(userInvestment.fundedAmount))
              : null}
            {stat(
              "Current Value",
              formatCurrency(userInvestment.currentValue),
            )}
            {stat(
              "Ownership",
              formatPercentage(userInvestment.ownershipPercentage),
            )}
          </dl>
        </div>
      ) : null}

      {userInterest && !userInvestment ? (
        <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-primary">
                {userInterest.status === "pass"
                  ? "You passed on this deal"
                  : "Interest sent — our team will follow up."}
              </p>
              {userInterest.status !== "pass" ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Status:{" "}
                  {interestStatusLabels[userInterest.status] || "Interested"}
                  {userInterest.proposedAmount
                    ? ` · Estimated: ${formatCurrency(userInterest.proposedAmount)}`
                    : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

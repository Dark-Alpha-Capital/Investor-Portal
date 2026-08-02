import { CheckCircle2, FileText, DollarSign, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export function UserStatusCard({
  userInterest,
  userInvestment,
  permissions,
}: UserStatusCardProps) {
  const isFunded = userInvestment?.status === "funded";

  return (
    <section>
      <div>
        <h3>Your Status</h3>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {permissions.isAdminPreview ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
              <Eye className="h-3 w-3" />
              Admin preview
            </div>
          ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              permissions.accessLevel === "data_room"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : permissions.accessLevel === "teaser"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
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
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Capital Commitment</span>
              <Badge variant={isFunded ? "default" : "secondary"}>
                {investorCommitmentLabel(userInvestment.status)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Committed</p>
                <p className="font-semibold">
                  {formatCurrency(userInvestment.committedAmount)}
                </p>
              </div>
              {isFunded ? (
                <div>
                  <p className="text-muted-foreground">Funded</p>
                  <p className="font-semibold">
                    {formatCurrency(userInvestment.fundedAmount)}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-muted-foreground">Current Value</p>
                <p className="font-semibold">
                  {formatCurrency(userInvestment.currentValue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ownership</p>
                <p className="font-semibold">
                  {formatPercentage(userInvestment.ownershipPercentage)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {userInterest && !userInvestment ? (
          <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
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
      </div>
    </section>
  );
}

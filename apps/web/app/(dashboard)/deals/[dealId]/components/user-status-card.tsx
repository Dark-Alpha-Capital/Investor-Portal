import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

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

type UserStatusCardProps = {
  userInterest: UserInterest;
  userInvestment: UserInvestment;
};

const interestStatusLabels: Record<string, string> = {
  interested: "Interested",
  soft_committed: "Soft Committed",
  pass: "Passed",
  meeting_requested: "Meeting Requested",
};

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
}: UserStatusCardProps) {
  if (!userInterest && !userInvestment) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userInvestment && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Active Investment</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Committed</p>
                <p className="font-semibold">
                  {formatCurrency(userInvestment.committedAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Funded</p>
                <p className="font-semibold">
                  {formatCurrency(userInvestment.fundedAmount)}
                </p>
              </div>
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
        )}
        {userInterest && !userInvestment && (
          <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-primary">
                  Interest Sent – IR Team will contact you.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status:{" "}
                  {interestStatusLabels[userInterest.status] ||
                    userInterest.status}
                  {userInterest.proposedAmount &&
                    ` • Amount: ${formatCurrency(userInterest.proposedAmount)}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


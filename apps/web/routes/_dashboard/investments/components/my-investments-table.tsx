import { AppLink as Link } from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INVESTMENT_STATUS_LABELS } from "@repo/db/investment-closing";
import {
  dealLifecycleStatusLabels,
  isDealLifecycleStatus,
} from "@repo/db/deal-status";

export type MyInvestmentRow = {
  id: string;
  dealId: string;
  dealName: string;
  dealStatus: string;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  committedAmount: string;
  fundedAmount: string;
  currentValue: string | null;
  distributions: string;
  status: string;
  ownershipPercentage: string | null;
  committedDate: string;
};

const investmentStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  pending_documents: "outline",
  documents_generated: "outline",
  awaiting_signature: "outline",
  awaiting_funds: "default",
  funded: "default",
  closed: "default",
  cancelled: "destructive",
  expired: "destructive",
  rejected: "destructive",
  transferred: "secondary",
  liquidated: "secondary",
  written_off: "destructive",
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
  return `$${num.toLocaleString()}`;
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function MyInvestmentsTable({ investments }: { investments: MyInvestmentRow[] }) {
  return (
    <div className="overflow-x-auto border-y border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-72 font-semibold">Deal</TableHead>
            <TableHead className="font-semibold">Sector</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Committed</TableHead>
            <TableHead className="text-right font-semibold">Funded</TableHead>
            <TableHead className="text-right font-semibold">Current Value</TableHead>
            <TableHead className="text-right font-semibold">Distributions</TableHead>
            <TableHead className="text-right font-semibold">Ownership</TableHead>
            <TableHead className="text-right font-semibold">Committed Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => (
            <TableRow
              key={investment.id}
              className="group border-b border-border transition-colors duration-150 hover:bg-muted/20"
            >
              <TableCell>
                <Link
                  href={`/deals/${investment.dealId}`}
                  className="block transition-colors duration-150 hover:text-primary"
                >
                  <span className="font-medium">{investment.dealName}</span>
                  {investment.dealStatus && (
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                      {isDealLifecycleStatus(investment.dealStatus)
                        ? dealLifecycleStatusLabels[investment.dealStatus]
                        : investment.dealStatus.replace(/_/g, " ")}
                    </p>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {investment.sector || "-"}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={investmentStatusVariant[investment.status] ?? "secondary"}
                  className="capitalize"
                >
                  {INVESTMENT_STATUS_LABELS[investment.status] ??
                    investment.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(investment.committedAmount)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(investment.fundedAmount)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(investment.currentValue)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(investment.distributions)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatPercentage(investment.ownershipPercentage)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDate(investment.committedDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

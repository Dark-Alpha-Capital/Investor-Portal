import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

type Deal = {
  targetCompany: string | null;
  sector: string | null;
  geography: string | null;
  revenue: string | null;
  ebitda: string | null;
  holdPeriod: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  minInvestment: string | null;
  closeDate: string | null;
  dealType: string | null;
  targetRaise: string | null;
};

type DealExecutiveSummaryProps = {
  deal: Deal;
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
};

const formatMoic = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}x`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const rows: Array<{ label: string; value: (deal: Deal) => string }> = [
  { label: "Target Company", value: (d) => d.targetCompany || "—" },
  { label: "Industry", value: (d) => d.sector || "—" },
  { label: "Location", value: (d) => d.geography || "—" },
  { label: "Deal Type", value: (d) => d.dealType || "—" },
  { label: "Revenue", value: (d) => formatCurrency(d.revenue) },
  { label: "EBITDA", value: (d) => formatCurrency(d.ebitda) },
  { label: "Expected Hold Period", value: (d) => d.holdPeriod || "—" },
  { label: "Target IRR", value: (d) => formatPercentage(d.targetIrr) },
  { label: "Target MOIC", value: (d) => formatMoic(d.targetMoic) },
  { label: "Target Raise", value: (d) => formatCurrency(d.targetRaise) },
  { label: "Minimum Investment", value: (d) => formatCurrency(d.minInvestment) },
  { label: "Closing Date", value: (d) => formatDate(d.closeDate) },
];

export function DealExecutiveSummary({ deal }: DealExecutiveSummaryProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Executive Summary</h2>
      <div className="border rounded-lg">
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium w-1/3 text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell>{row.value(deal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

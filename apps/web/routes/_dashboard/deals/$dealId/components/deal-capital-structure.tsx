import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

type DealCapitalStructureProps = {
  purchasePrice: string | null;
  debt: string | null;
  sponsorEquity: string | null;
  lpEquity: string | null;
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

export function DealCapitalStructure({
  purchasePrice,
  debt,
  sponsorEquity,
  lpEquity,
}: DealCapitalStructureProps) {
  const hasAny = [purchasePrice, debt, sponsorEquity, lpEquity].some(
    (v) => v != null && v !== "",
  );

  if (!hasAny) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Capital structure has not been published for this deal yet.
      </div>
    );
  }

  const rows = [
    { label: "Purchase Price", value: purchasePrice },
    { label: "Debt", value: debt },
    { label: "Sponsor Equity", value: sponsorEquity },
    { label: "LP Equity", value: lpEquity },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Capital Structure</h2>
      <div className="border rounded-lg">
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium w-1/3 text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell>{formatCurrency(row.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

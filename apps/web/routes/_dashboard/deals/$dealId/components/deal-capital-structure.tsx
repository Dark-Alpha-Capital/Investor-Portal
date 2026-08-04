import { cn } from "@/lib/utils";

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
  const rows = [
    { label: "Purchase Price", value: purchasePrice },
    { label: "Debt", value: debt },
    { label: "Sponsor Equity", value: sponsorEquity },
    { label: "LP Equity", value: lpEquity },
  ];

  const hasAny = rows.some((row) => row.value != null && row.value !== "");

  if (!hasAny) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Capital structure has not been published for this deal yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">
        Capital Structure
      </h2>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ label, value }) => {
          const v = formatCurrency(value);
          return (
            <div key={label} className="bg-card px-5 py-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd
                className={cn(
                  "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
                  v === "—" && "text-muted-foreground",
                )}
              >
                {v}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

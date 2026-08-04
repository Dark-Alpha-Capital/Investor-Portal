import { cn } from "@/lib/utils";

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

const EMPTY = "—";

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return EMPTY;
  const num = parseFloat(value);
  if (isNaN(num)) return EMPTY;
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
  if (!value) return EMPTY;
  const num = parseFloat(value);
  if (isNaN(num)) return EMPTY;
  return `${num.toFixed(1)}%`;
};

const formatMoic = (value: string | null | undefined): string => {
  if (!value) return EMPTY;
  const num = parseFloat(value);
  if (isNaN(num)) return EMPTY;
  return `${num.toFixed(1)}x`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return EMPTY;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return EMPTY;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const statCards: Array<{ label: string; value: (deal: Deal) => string }> = [
  { label: "Target IRR", value: (d) => formatPercentage(d.targetIrr) },
  { label: "Target MOIC", value: (d) => formatMoic(d.targetMoic) },
  { label: "Target Raise", value: (d) => formatCurrency(d.targetRaise) },
  { label: "Minimum Investment", value: (d) => formatCurrency(d.minInvestment) },
];

const details: Array<{ label: string; value: (deal: Deal) => string }> = [
  { label: "Target Company", value: (d) => d.targetCompany || EMPTY },
  { label: "Industry", value: (d) => d.sector || EMPTY },
  { label: "Location", value: (d) => d.geography || EMPTY },
  { label: "Deal Type", value: (d) => d.dealType || EMPTY },
  { label: "Revenue", value: (d) => formatCurrency(d.revenue) },
  { label: "EBITDA", value: (d) => formatCurrency(d.ebitda) },
  { label: "Expected Hold Period", value: (d) => d.holdPeriod || EMPTY },
  { label: "Closing Date", value: (d) => formatDate(d.closeDate) },
];

export function DealExecutiveSummary({ deal }: DealExecutiveSummaryProps) {
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Executive Summary
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
          {statCards.map(({ label, value }) => {
            const v = value(deal);
            return (
              <div key={label} className="bg-card px-5 py-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </dt>
                <dd
                  className={cn(
                    "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
                    v === EMPTY && "text-muted-foreground",
                  )}
                >
                  {v}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        {details.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {value(deal)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

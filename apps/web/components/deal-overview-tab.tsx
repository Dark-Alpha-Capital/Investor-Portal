import { DealStatusChip } from "@/components/deal-status-chip";
import { cn } from "@/lib/utils";

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  revenue: string | null;
  ebitda: string | null;
  purchasePrice: string | null;
  debt: string | null;
  sponsorEquity: string | null;
  lpEquity: string | null;
  status: string;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatCurrencyCompact = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
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
  return `${num.toFixed(2)}x`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function OverviewTab({ deal }: { deal: Deal }) {
  const capitalStructure = [
    { label: "Revenue", value: formatCurrency(deal.revenue) },
    { label: "EBITDA", value: formatCurrency(deal.ebitda) },
    { label: "Purchase price", value: formatCurrency(deal.purchasePrice) },
    { label: "Debt", value: formatCurrency(deal.debt) },
    { label: "Sponsor equity", value: formatCurrency(deal.sponsorEquity) },
    { label: "LP equity", value: formatCurrency(deal.lpEquity) },
  ].filter((item) => item.value !== "—");

  const facts = [
    { label: "Deal type", value: deal.dealType || "—" },
    { label: "Sector", value: deal.sector || "—" },
    { label: "Geography", value: deal.geography || "—" },
    { label: "Launch date", value: formatDate(deal.launchDate) },
    { label: "Close date", value: formatDate(deal.closeDate) },
    { label: "Created", value: formatDate(deal.createdAt) },
    { label: "Last updated", value: formatDate(deal.updatedAt) },
  ];

  return (
    <div className="space-y-8">
      {/* KPI band */}
      <section>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
            <Stat label="Target raise" value={formatCurrencyCompact(deal.targetRaise)} />
            <Stat label="Minimum investment" value={formatCurrencyCompact(deal.minInvestment)} />
            <Stat label="Target IRR" value={formatPercentage(deal.targetIrr)} accent />
            <Stat label="Target MOIC" value={formatMoic(deal.targetMoic)} accent />
          </div>
        </div>
      </section>

      {/* Capital structure */}
      {capitalStructure.length > 0 ? (
        <section>
          <SectionHeader index="01" title="Capital structure" />
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              {capitalStructure.map((item) => (
                <div key={item.label} className="px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-medium tabular-nums text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Deal facts */}
      <section>
        <SectionHeader index="02" title="Deal facts" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <dl className="grid grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 border-b border-r border-border px-5 py-3.5 sm:border-b">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <DealStatusChip status={deal.status} />
              </dd>
            </div>
            {facts.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 odd:sm:border-r"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">
                  {value}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <dt className="text-sm text-muted-foreground">Slug</dt>
              <dd>
                {deal.slug ? (
                  <code className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {deal.slug}
                  </code>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="font-mono text-xs font-semibold text-muted-foreground">
        {index}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
        {title}
      </h2>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

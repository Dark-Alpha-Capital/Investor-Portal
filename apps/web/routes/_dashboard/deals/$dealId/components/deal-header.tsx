import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type Deal = {
  id: string;
  name: string;
  status: string;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
};

type DealHeaderProps = {
  deal: Deal;
  curationNote: string | null;
};

const statusStyles: Record<string, string> = {
  coming_soon:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  closing:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  funded:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  exited: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function DealHeader({ deal, curationNote }: DealHeaderProps) {
  const meta = [
    deal.dealType ? { label: "Deal Type", value: deal.dealType } : null,
    deal.sector ? { label: "Industry", value: deal.sector } : null,
    deal.geography ? { label: "Location", value: deal.geography } : null,
  ].filter((m): m is { label: string; value: string } => m !== null);

  return (
    <header className="border-b border-border pb-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{deal.name}</h1>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            statusStyles[deal.status] ?? statusStyles.exited,
          )}
        >
          {deal.status.replace(/_/g, " ")}
        </span>
      </div>

      {deal.teaserSummary ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {deal.teaserSummary}
        </p>
      ) : null}

      {meta.length > 0 ? (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
          {meta.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {curationNote ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Curated for you</p>
            <p className="mt-0.5 text-sm italic text-muted-foreground">
              {curationNote}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}

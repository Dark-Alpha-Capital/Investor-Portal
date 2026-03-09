import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target } from "lucide-react";

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
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  curationNote?: string | null;
};

type DealCardProps = {
  deal: Deal;
};

const statusColors: Record<string, string> = {
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

export function DealCard({ deal }: DealCardProps) {
  const formatCurrency = (value: string | null) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  const dealUrl = `/deals/${deal.id}`;

  return (
    <Link href={dealUrl} className="block h-full">
      <section className="group h-full cursor-pointer border-border/50 transition-all duration-200 hover:border-border">
        {deal.coverImageUrl && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <img
              src={deal.coverImageUrl}
              alt={deal.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3">
              <Badge
                variant={(statusColors[deal.status] as any) || "secondary"}
                className="backdrop-blur-sm bg-background/80"
              >
                {deal.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        )}
        <div className={deal.coverImageUrl ? "" : "pb-3"}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl line-clamp-2 font-semibold group-hover:text-primary transition-colors flex-1">
              {deal.name}
            </h3>
            {!deal.coverImageUrl && (
              <Badge
                variant={(statusColors[deal.status] as any) || "secondary"}
                className="shrink-0"
              >
                {deal.status.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          {deal.teaserSummary && (
            <p className="line-clamp-2 text-sm mt-2">
              {deal.teaserSummary}
            </p>
          )}
          {deal.curationNote && (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Curated for you
              </p>
              <p className="text-sm text-muted-foreground italic">
                "{deal.curationNote}"
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {/* Sector and Geography */}
          {(deal.sector || deal.geography) && (
            <div className="flex flex-wrap gap-2">
              {deal.sector && (
                <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {deal.sector}
                </span>
              )}
              {deal.geography && (
                <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {deal.geography}
                </span>
              )}
            </div>
          )}

          {/* Financial Metrics */}
          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            {deal.targetRaise && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  <span>Target Raise</span>
                </div>
                <p className="text-base font-semibold">
                  {formatCurrency(deal.targetRaise)}
                </p>
              </div>
            )}
            {deal.minInvestment && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Min Investment</span>
                </div>
                <p className="text-base font-semibold">
                  {formatCurrency(deal.minInvestment)}
                </p>
              </div>
            )}
            {deal.targetIrr && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Target IRR</span>
                </div>
                <p className="text-base font-semibold">
                  {parseFloat(deal.targetIrr).toFixed(1)}%
                </p>
              </div>
            )}
            {deal.targetMoic && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Target MOIC</span>
                </div>
                <p className="text-base font-semibold">
                  {parseFloat(deal.targetMoic).toFixed(2)}x
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Link>
  );
}

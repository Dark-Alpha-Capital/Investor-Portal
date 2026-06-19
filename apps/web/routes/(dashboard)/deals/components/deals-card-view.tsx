
import { AppLink as Link } from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, DollarSign, Target } from "lucide-react";

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
  isCurated?: boolean;
};

type DealsCardViewProps = {
  deals: Deal[];
};

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

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ");
};

function DealCardItem({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/${deal.id}`} className="block group">
      <article className="h-full overflow-hidden rounded-lg border border-border/50 transition-all duration-200 hover:border-border">
        {deal.coverImageUrl && (
          <div className="relative w-full h-40 overflow-hidden bg-muted">
            <img
              src={deal.coverImageUrl}
              alt={deal.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {deal.name}
                </h3>
                {deal.isCurated && (
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <Badge variant="secondary" className="capitalize shrink-0">
                {formatStatus(deal.status)}
              </Badge>
            </div>
            {deal.teaserSummary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {deal.teaserSummary}
              </p>
            )}
          </div>

          {/* Tags */}
          {(deal.sector || deal.geography) && (
            <div className="flex flex-wrap gap-1.5">
              {deal.sector && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                  {deal.sector}
                </span>
              )}
              {deal.geography && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                  {deal.geography}
                </span>
              )}
            </div>
          )}

          {/* Curation Note */}
          {deal.curationNote && (
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                "{deal.curationNote}"
              </p>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            {deal.targetRaise && (
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-sm font-medium truncate">
                    {formatCurrency(deal.targetRaise)}
                  </p>
                </div>
              </div>
            )}
            {deal.minInvestment && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Minimum</p>
                  <p className="text-sm font-medium truncate">
                    {formatCurrency(deal.minInvestment)}
                  </p>
                </div>
              </div>
            )}
            {deal.targetIrr && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">IRR</p>
                  <p className="text-sm font-medium">
                    {parseFloat(deal.targetIrr).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
            {deal.targetMoic && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">MOIC</p>
                  <p className="text-sm font-medium">
                    {parseFloat(deal.targetMoic).toFixed(2)}x
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function DealsCardView({ deals }: DealsCardViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal, index) => (
        <div
          key={deal.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "both",
          }}
        >
          <DealCardItem deal={deal} />
        </div>
      ))}
    </div>
  );
}

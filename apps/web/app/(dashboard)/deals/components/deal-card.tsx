import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    <Link href={dealUrl}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        {deal.coverImageUrl && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
            <img
              src={deal.coverImageUrl}
              alt={deal.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl line-clamp-2">{deal.name}</CardTitle>
            <Badge variant={(statusColors[deal.status] as any) || "secondary"}>
              {deal.status.replace(/_/g, " ")}
            </Badge>
          </div>
          {deal.teaserSummary && (
            <CardDescription className="line-clamp-2">
              {deal.teaserSummary}
            </CardDescription>
          )}
          {deal.curationNote && (
            <div className="mt-2 p-2 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground italic">
                "{deal.curationNote}"
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Sector and Geography */}
            {(deal.sector || deal.geography) && (
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {deal.sector && (
                  <span className="px-2 py-1 bg-muted rounded-md">
                    {deal.sector}
                  </span>
                )}
                {deal.geography && (
                  <span className="px-2 py-1 bg-muted rounded-md">
                    {deal.geography}
                  </span>
                )}
              </div>
            )}

            {/* Financial Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              {deal.targetRaise && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Target Raise
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(deal.targetRaise)}
                    </p>
                  </div>
                </div>
              )}
              {deal.minInvestment && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Min Investment
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(deal.minInvestment)}
                    </p>
                  </div>
                </div>
              )}
              {deal.targetIrr && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Target IRR</p>
                    <p className="font-semibold">
                      {parseFloat(deal.targetIrr).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
              {deal.targetMoic && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Target MOIC</p>
                    <p className="font-semibold">
                      {parseFloat(deal.targetMoic).toFixed(2)}x
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

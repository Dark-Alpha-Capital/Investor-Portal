import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
};

type DealDetailViewProps = {
  deal: Deal;
};

const statusColors: Record<string, string> = {
  draft: "secondary",
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

const visibilityColors: Record<string, string> = {
  public: "default",
  accredited: "default",
  invite_only: "secondary",
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function DealDetailView({ deal }: DealDetailViewProps) {
  if (!deal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Not Found</CardTitle>
          <CardDescription>
            The deal you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl font-bold">{deal.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={statusColors[deal.status] as any}
                  className="text-xs font-semibold px-3 py-1"
                >
                  {deal.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
                <Badge
                  variant={visibilityColors[deal.visibility] as any}
                  className="text-xs font-semibold px-3 py-1"
                >
                  {deal.visibility.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
            </div>
            {deal.teaserSummary && (
              <CardDescription className="text-base leading-relaxed">
                {deal.teaserSummary}
              </CardDescription>
            )}
          </div>
          {deal.coverImageUrl && (
            <div className="shrink-0">
              <img
                src={deal.coverImageUrl}
                alt={deal.name}
                className="w-32 h-32 object-cover rounded-lg border-2 shadow-md"
              />
            </div>
          )}
        </div>
      </CardHeader>
      {deal.description && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {deal.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

import { caller } from "@/trpc/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

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

export async function OverviewTab({ dealId }: { dealId: string }) {
  const result = await caller.deals.getById({ dealId });
  const deal = result.deal;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deal Name
              </p>
              <p className="font-semibold text-base">{deal.name}</p>
            </div>
            {deal.slug && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Slug
                </p>
                <p className="font-medium text-sm font-mono bg-muted px-2 py-1 rounded">
                  {deal.slug}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deal Type
              </p>
              <p className="font-medium">{deal.dealType || "-"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <Badge variant={statusColors[deal.status] as any}>
                {deal.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Visibility
              </p>
              <Badge variant={visibilityColors[deal.visibility] as any}>
                {deal.visibility.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              Categorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sector
              </p>
              <p className="font-medium">{deal.sector || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Geography
              </p>
              <p className="font-medium">{deal.geography || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target Raise
              </p>
              <p className="font-semibold text-lg">
                {formatCurrency(deal.targetRaise)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Minimum Investment
              </p>
              <p className="font-semibold text-lg">
                {formatCurrency(deal.minInvestment)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target IRR
              </p>
              <p className="font-semibold text-lg">
                {formatPercentage(deal.targetIrr)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target MOIC
              </p>
              <p className="font-medium">{deal.targetMoic || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Launch Date
              </p>
              <p className="font-medium">{formatDate(deal.launchDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Close Date
              </p>
              <p className="font-medium">{formatDate(deal.closeDate)}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Created
              </p>
              <p className="font-medium text-sm">
                {formatDate(deal.createdAt)}
              </p>
            </div>
            {deal.updatedAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Last Updated
                </p>
                <p className="font-medium text-sm">
                  {formatDate(deal.updatedAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


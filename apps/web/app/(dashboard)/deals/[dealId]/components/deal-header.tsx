import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Sparkles } from "lucide-react";

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  status: string;
  coverImageUrl: string | null;
};

type DealHeaderProps = {
  deal: Deal;
  curationNote: string | null;
};

const statusColors: Record<string, string> = {
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

export function DealHeader({ deal, curationNote }: DealHeaderProps) {
  return (
    <div className="space-y-6">
      {deal.coverImageUrl && (
        <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg">
          <img
            src={deal.coverImageUrl}
            alt={deal.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{deal.name}</h1>
          <Badge variant={(statusColors[deal.status] as any) || "secondary"}>
            {deal.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {deal.teaserSummary && (
          <p className="text-base text-muted-foreground">
            {deal.teaserSummary}
          </p>
        )}

        {curationNote && (
          <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Curated for You</p>
                <p className="text-sm text-muted-foreground italic mt-1">
                  "{curationNote}"
                </p>
              </div>
            </div>
          </div>
        )}

        {deal.description && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(deal.description) }}
          />
        )}
      </div>
    </div>
  );
}

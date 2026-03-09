import { sanitizeHtml } from "@/lib/sanitize-html";

type Deal = {
  description: string | null;
  teaserSummary: string | null;
};

export function DescriptionTab({ deal }: { deal: Deal }) {

  return (
    <div className="space-y-6">
      {/* Teaser Summary */}
      {deal.teaserSummary && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Teaser Summary
          </h3>
          <p className="text-base leading-relaxed">{deal.teaserSummary}</p>
        </div>
      )}

      {/* Description */}
      {deal.description && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Description
          </h3>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(deal.description) }}
          />
        </div>
      )}

      {!deal.teaserSummary && !deal.description && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No description available for this deal.</p>
        </div>
      )}
    </div>
  );
}

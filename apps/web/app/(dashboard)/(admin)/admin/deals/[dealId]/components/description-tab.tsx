import { caller } from "@/trpc/server";

export async function DescriptionTab({ dealId }: { dealId: string }) {
  const result = await caller.deals.getById({ dealId });
  const deal = result.deal;

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
            dangerouslySetInnerHTML={{ __html: deal.description }}
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


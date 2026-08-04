import { sanitizeHtml } from "@/lib/helpers/sanitize-html";
import { FileText, ScrollText } from "lucide-react";

type Deal = {
  description: string | null;
  teaserSummary: string | null;
};

export function DescriptionTab({ deal }: { deal: Deal }) {
  const hasContent = Boolean(deal.teaserSummary || deal.description);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
          <ScrollText className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            No description yet
          </p>
          <p className="text-sm text-muted-foreground">
            Add a teaser summary and full description when editing this deal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {deal.teaserSummary ? (
        <section>
          <SectionLabel>Teaser summary</SectionLabel>
          <blockquote className="border-l-2 border-primary pl-5">
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {deal.teaserSummary}
            </p>
          </blockquote>
        </section>
      ) : null}

      {deal.description ? (
        <section>
          <SectionLabel>Full description</SectionLabel>
          <div className="rounded-lg border border-border bg-card px-6 py-8 sm:px-8">
            <div
              className="prose prose-sm max-w-none text-[15px] leading-relaxed dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:dark:text-muted-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(deal.description),
              }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
      <FileText className="size-4" />
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">
        {children}
      </h3>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

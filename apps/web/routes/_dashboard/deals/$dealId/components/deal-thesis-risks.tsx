import { sanitizeHtml } from "@/lib/helpers/sanitize-html";

type DealThesisRisksProps = {
  investmentThesis: string | null;
  risks: string | null;
};

function isEmptyHtml(html: string | null): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
}

export function DealThesisRisks({
  investmentThesis,
  risks,
}: DealThesisRisksProps) {
  const hasThesis = !isEmptyHtml(investmentThesis);
  const hasRisks = !isEmptyHtml(risks);

  if (!hasThesis && !hasRisks) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Thesis and risks have not been published for this deal yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasThesis ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Investment Thesis</h2>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(investmentThesis!),
            }}
          />
        </section>
      ) : null}

      {hasRisks ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Risks</h2>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(risks!) }}
          />
        </section>
      ) : null}
    </div>
  );
}

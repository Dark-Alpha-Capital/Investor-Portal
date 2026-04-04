import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchSectorPagePayload } from "@/lib/server-fns/marketing-route-data";
import { siteConfig } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowRight, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedSectorLinks } from "@/components/seo/internal-links";

type SectorLoaderOk = Extract<
  Awaited<ReturnType<typeof fetchSectorPagePayload>>,
  { tag: "ok" }
>;

export const Route = createFileRoute("/(main-site)/sectors/$sector/")({
  loader: async ({ params }: { params: { sector: string } }) => {
    const r = await fetchSectorPagePayload({
      data: { sectorSlug: params.sector },
    });
    if (r.tag === "not_found") {
      throw notFound();
    }
    return r;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const d = loaderData as SectorLoaderOk;
    const name = d.sector.name;
    const description = d.sector.description;
    return {
      meta: [
        {
          title: `${name} Investments | ${siteConfig.name}`,
        },
        {
          name: "description",
          content: description,
        },
        {
          name: "keywords",
          content: d.sector.keywords.join(", "),
        },
        { property: "og:title", content: `${name} Investments` },
        {
          property: "og:description",
          content: description,
        },
      ],
    };
  },
  component: SectorRoutePage,
});

function SectorRoutePage() {
  const data = Route.useLoaderData();
  return (
    <>
      <JsonLd data={data.jsonLd} />
      <SectorInner data={data} />
    </>
  );
}

function SectorInner({ data }: { data: SectorLoaderOk }) {
  const { sector, relatedSectors, breadcrumbItems } = data;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <section className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          {sector.name} Investments
        </h1>
        <p className="max-w-3xl text-xl text-muted-foreground">
          {sector.description}
        </p>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4" />
            Active Deals
          </p>
          <p className="text-2xl font-bold">0</p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            Total Invested
          </p>
          <p className="text-2xl font-bold">$0</p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <BarChart3 className="mr-2 h-4 w-4" />
            Avg. Return
          </p>
          <p className="text-2xl font-bold">N/A</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">
          About {sector.name} Investing
        </h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{sector.longDescription}</p>
        </div>
      </section>

      <section className="mb-12 rounded-lg bg-muted/50 p-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="mb-2 text-2xl font-bold">
              Ready to Explore {sector.name} Opportunities?
            </h2>
            <p className="text-muted-foreground">
              Join DarkAlpha Capital to access exclusive{" "}
              {sector.name.toLowerCase()} investment deals.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link to="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/offerings">View All Offerings</Link>
            </Button>
          </div>
        </div>
      </section>

      {relatedSectors.length > 0 && (
        <section className="mb-12">
          <RelatedSectorLinks currentSector={sector.slug} />
        </section>
      )}

      <section className="border-t pt-8">
        <h2 className="mb-4 text-xl font-bold">Explore by Investment Type</h2>
        <p className="mb-4 text-muted-foreground">
          DarkAlpha Capital offers various investment structures for{" "}
          {sector.name.toLowerCase()} opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/investments/private-equity">Private Equity</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/investments/venture-capital">Venture Capital</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/investments/growth-equity">Growth Equity</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

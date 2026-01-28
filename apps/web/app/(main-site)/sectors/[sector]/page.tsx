import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import {
  getSectorBySlug,
  getAllSectorSlugs,
  getRelatedSectors,
} from "@/lib/constants/sectors";
import {
  generatePageMetadata,
  generateFinancialServiceJsonLd,
  generateWebPageJsonLd,
  siteConfig,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { SectorSkeleton } from "@/components/skeleton/sector-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedSectorLinks } from "@/components/seo/internal-links";

type Params = Promise<{ sector: string }>;

interface SectorPageProps {
  params: Params;
}

/**
 * Generate static params for all sector pages at build time.
 * This enables static generation for programmatic SEO pages.
 */
export async function generateStaticParams() {
  return getAllSectorSlugs().map((sector) => ({ sector }));
}

/**
 * Generate dynamic metadata for each sector page.
 * Provides unique title, description, and keywords for SEO.
 */
export async function generateMetadata({
  params,
}: SectorPageProps): Promise<Metadata> {
  const { sector: sectorSlug } = await params;
  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    return generatePageMetadata({
      title: "Sector Not Found",
      description: "The requested investment sector could not be found.",
      noIndex: true,
    });
  }

  return generatePageMetadata({
    title: `${sector.name} Investments | ${siteConfig.name}`,
    description: sector.description,
    keywords: sector.keywords,
    canonical: `/sectors/${sector.slug}`,
  });
}

/**
 * Sector Page using Next.js Cache Components pattern.
 */
export default async function SectorPage({ params }: SectorPageProps) {
  return (
    <Suspense fallback={<SectorSkeleton />}>
      <FetchSectorWrapper params={params} />
    </Suspense>
  );
}

async function FetchSectorWrapper({ params }: { params: Params }) {
  const { sector: sectorSlug } = await params;
  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    notFound();
  }

  // Generate JSON-LD structured data
  const financialServiceJsonLd = generateFinancialServiceJsonLd(
    `${sector.name} Investments`,
    sector.description,
    `/sectors/${sector.slug}`,
    `${sector.name} Investment Services`,
  );

  const webPageJsonLd = generateWebPageJsonLd(
    `${sector.name} Investments`,
    sector.description,
    `/sectors/${sector.slug}`,
    [
      { name: "Sectors", href: "/sectors" },
      { name: sector.name, href: `/sectors/${sector.slug}` },
    ],
  );

  return (
    <>
      {/* Static shell - JSON-LD structured data (prerendered) */}
      <JsonLd data={[financialServiceJsonLd, webPageJsonLd]} />

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<SectorSkeleton />}>
        <SectorContent sectorSlug={sectorSlug} />
      </Suspense>
    </>
  );
}

async function SectorContent({ sectorSlug }: { sectorSlug: string }) {
  "use cache";
  cacheLife("days");
  cacheTag(`sector-${sectorSlug}`);

  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    return null;
  }

  const relatedSectors = getRelatedSectors(sectorSlug);
  const breadcrumbItems = [
    { name: "Sectors", href: "/sectors" },
    { name: sector.name, href: `/sectors/${sector.slug}` },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {sector.name} Investments
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {sector.description}
        </p>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Avg. Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">N/A</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          About {sector.name} Investing
        </h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{sector.longDescription}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 rounded-lg p-8 mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Ready to Explore {sector.name} Opportunities?
            </h2>
            <p className="text-muted-foreground">
              Join DarkAlpha Capital to access exclusive{" "}
              {sector.name.toLowerCase()} investment deals.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/offerings">View All Offerings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Sectors */}
      {relatedSectors.length > 0 && (
        <section className="mb-12">
          <RelatedSectorLinks currentSector={sector.slug} />
        </section>
      )}

      {/* Investment Types Cross-Link */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Explore by Investment Type</h2>
        <p className="text-muted-foreground mb-4">
          DarkAlpha Capital offers various investment structures for{" "}
          {sector.name.toLowerCase()} opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/investments/private-equity">Private Equity</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/investments/venture-capital">Venture Capital</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/investments/growth-equity">Growth Equity</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

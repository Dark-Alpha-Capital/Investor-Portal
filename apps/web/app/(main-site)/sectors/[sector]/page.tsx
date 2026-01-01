import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSectorBySlug, getAllSectorSlugs } from "@/lib/constants/sectors";
import {
  generatePageMetadata,
  generateFinancialServiceJsonLd,
  generateWebPageJsonLd,
  siteConfig,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { SectorContent } from "./components/sector-content";
import { SectorSkeleton } from "@/components/skeleton/sector-skeleton";

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
 *
 * Structure:
 * - Static shell: JSON-LD structured data (prerendered)
 * - Dynamic content: FetchSectorWrapper wrapped in Suspense (streamed at request time)
 *
 * The FetchSectorWrapper component:
 * - Awaits params
 * - Wraps FetchSectorContent in Suspense
 *
 * The FetchSectorContent component:
 * - Handles runtime data (params)
 * - Calls cached data fetching function
 * - Renders the sector page content
 */
export default async function SectorPage({ params }: SectorPageProps) {
  return (
    <Suspense fallback={<SectorSkeleton />}>
      <FetchSectorWrapper p={params} />
    </Suspense>
  );
}

async function FetchSectorWrapper({ p }: { p: Params }) {
  const { sector: sectorSlug } = await p;
  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    notFound();
  }

  // Generate JSON-LD structured data
  const financialServiceJsonLd = generateFinancialServiceJsonLd(
    `${sector.name} Investments`,
    sector.description,
    `/sectors/${sector.slug}`,
    `${sector.name} Investment Services`
  );

  const webPageJsonLd = generateWebPageJsonLd(
    `${sector.name} Investments`,
    sector.description,
    `/sectors/${sector.slug}`,
    [
      { name: "Sectors", href: "/sectors" },
      { name: sector.name, href: `/sectors/${sector.slug}` },
    ]
  );

  return (
    <>
      {/* Static shell - JSON-LD structured data (prerendered) */}
      <JsonLd data={[financialServiceJsonLd, webPageJsonLd]} />

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<SectorSkeleton />}>
        <FetchSectorContent params={p} />
      </Suspense>
    </>
  );
}

async function FetchSectorContent({ params }: { params: Params }) {
  return <SectorContent params={params} />;
}

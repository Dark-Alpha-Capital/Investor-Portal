import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getInvestmentTypeBySlug,
  getAllInvestmentTypeSlugs,
} from "@/lib/constants/investment-types";
import {
  generatePageMetadata,
  generateFinancialServiceJsonLd,
  generateWebPageJsonLd,
  siteConfig,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { InvestmentTypeContent } from "./components/investment-type-content";
import { InvestmentTypeSkeleton } from "@/components/skeleton/investment-type-skeleton";

type Params = Promise<{ type: string }>;

interface InvestmentTypePageProps {
  params: Params;
}

/**
 * Generate static params for all investment type pages at build time.
 * This enables static generation for programmatic SEO pages.
 */
export async function generateStaticParams() {
  return getAllInvestmentTypeSlugs().map((type) => ({ type }));
}

/**
 * Generate dynamic metadata for each investment type page.
 * Provides unique title, description, and keywords for SEO.
 */
export async function generateMetadata({
  params,
}: InvestmentTypePageProps): Promise<Metadata> {
  const { type: typeSlug } = await params;
  const investmentType = getInvestmentTypeBySlug(typeSlug);

  if (!investmentType) {
    return generatePageMetadata({
      title: "Investment Type Not Found",
      description: "The requested investment type could not be found.",
      noIndex: true,
    });
  }

  return generatePageMetadata({
    title: `${investmentType.name} Investments | ${siteConfig.name}`,
    description: investmentType.description,
    keywords: investmentType.keywords,
    canonical: `/investments/${investmentType.slug}`,
  });
}

/**
 * Investment Type Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: JSON-LD structured data (prerendered)
 * - Dynamic content: InvestmentTypeContent wrapped in Suspense (streamed at request time)
 *
 * The InvestmentTypeContent component:
 * - Handles runtime data (params)
 * - Calls cached data fetching function
 * - Renders the investment type page content
 */
export default async function InvestmentTypePage({
  params,
}: InvestmentTypePageProps) {
  const { type: typeSlug } = await params;
  const investmentType = getInvestmentTypeBySlug(typeSlug);

  if (!investmentType) {
    notFound();
  }

  // Generate JSON-LD structured data
  const financialServiceJsonLd = generateFinancialServiceJsonLd(
    investmentType.name,
    investmentType.description,
    `/investments/${investmentType.slug}`,
    investmentType.name
  );

  const webPageJsonLd = generateWebPageJsonLd(
    `${investmentType.name} Investments`,
    investmentType.description,
    `/investments/${investmentType.slug}`,
    [
      { name: "Investments", href: "/investments" },
      { name: investmentType.name, href: `/investments/${investmentType.slug}` },
    ]
  );

  return (
    <>
      {/* Static shell - JSON-LD structured data (prerendered) */}
      <JsonLd data={[financialServiceJsonLd, webPageJsonLd]} />

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<InvestmentTypeSkeleton />}>
        <InvestmentTypeContent params={params} />
      </Suspense>
    </>
  );
}

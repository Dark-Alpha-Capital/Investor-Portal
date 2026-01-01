import type { InvestmentType } from "@/types/seo";

/**
 * Investment types for programmatic SEO pages
 */
export const INVESTMENT_TYPES: InvestmentType[] = [
  {
    slug: "private-equity",
    name: "Private Equity",
    description:
      "Access institutional-quality private equity investments in established companies.",
    longDescription:
      "Private equity investments provide access to established companies not available on public markets. DarkAlpha Capital curates private equity opportunities featuring companies with proven business models, strong management teams, and clear value creation plans. Our private equity investments typically target companies with EBITDA of $5M+ and focus on control or significant minority positions that enable active value creation.",
    keywords: [
      "private equity investments",
      "PE investments",
      "buyout investments",
      "private equity fund",
      "institutional private equity",
      "middle market private equity",
    ],
    minInvestment: "$100,000",
    typicalHorizon: "5-7 years",
    riskLevel: "medium",
    relatedTypes: ["growth-equity", "venture-capital"],
  },
  {
    slug: "venture-capital",
    name: "Venture Capital",
    description:
      "Invest in early-stage companies with high growth potential and disruptive technologies.",
    longDescription:
      "Venture capital investments offer exposure to innovative companies at the forefront of technological and market disruption. DarkAlpha Capital provides access to venture capital opportunities across seed, early, and growth stages. Our venture capital investments focus on companies with large addressable markets, differentiated products, and exceptional founding teams positioned to build category-defining businesses.",
    keywords: [
      "venture capital investments",
      "VC investments",
      "startup investments",
      "early stage investments",
      "seed investments",
      "growth stage investments",
    ],
    minInvestment: "$50,000",
    typicalHorizon: "7-10 years",
    riskLevel: "high",
    relatedTypes: ["growth-equity", "private-equity"],
  },
  {
    slug: "growth-equity",
    name: "Growth Equity",
    description:
      "Participate in the expansion of proven companies seeking capital for accelerated growth.",
    longDescription:
      "Growth equity investments bridge the gap between venture capital and traditional private equity, targeting companies with established products and revenue seeking capital for expansion. DarkAlpha Capital curates growth equity opportunities in companies with proven business models, strong unit economics, and clear paths to market leadership. Our growth equity strategy focuses on companies at inflection points poised for accelerated scaling.",
    keywords: [
      "growth equity investments",
      "expansion capital",
      "growth capital investments",
      "late stage investments",
      "scale-up investments",
      "minority growth investments",
    ],
    minInvestment: "$75,000",
    typicalHorizon: "4-6 years",
    riskLevel: "medium",
    relatedTypes: ["venture-capital", "private-equity"],
  },
  {
    slug: "real-estate-funds",
    name: "Real Estate Funds",
    description:
      "Diversify with professionally managed real estate investment funds.",
    longDescription:
      "Real estate funds provide diversified exposure to commercial and residential properties through professionally managed investment vehicles. DarkAlpha Capital offers access to real estate funds across property types including multifamily, office, industrial, and specialty sectors. Our real estate fund investments emphasize experienced managers with strong track records, disciplined investment processes, and alignment with investor interests.",
    keywords: [
      "real estate funds",
      "real estate investment funds",
      "commercial real estate funds",
      "property funds",
      "real estate PE funds",
      "real estate syndication",
    ],
    minInvestment: "$50,000",
    typicalHorizon: "5-10 years",
    riskLevel: "medium",
    relatedTypes: ["private-equity", "credit"],
  },
  {
    slug: "credit",
    name: "Private Credit",
    description:
      "Generate income through private lending and credit investment strategies.",
    longDescription:
      "Private credit investments offer attractive yield opportunities through direct lending and structured credit strategies. DarkAlpha Capital curates private credit opportunities providing senior secured loans, mezzanine financing, and specialty credit to middle-market companies. Our private credit investments emphasize downside protection, current income, and alignment with experienced credit managers.",
    keywords: [
      "private credit investments",
      "direct lending",
      "private debt investments",
      "mezzanine investments",
      "credit fund investments",
      "senior secured lending",
    ],
    minInvestment: "$100,000",
    typicalHorizon: "3-5 years",
    riskLevel: "low",
    relatedTypes: ["real-estate-funds", "private-equity"],
  },
  {
    slug: "secondaries",
    name: "Secondary Investments",
    description:
      "Access seasoned private equity portfolios at attractive entry points.",
    longDescription:
      "Secondary investments provide access to existing private equity fund interests and direct company stakes, often at discounts to net asset value. DarkAlpha Capital offers secondary investment opportunities that provide portfolio diversification, accelerated cash flows, and reduced blind pool risk. Our secondary investment strategy focuses on high-quality underlying assets with clear paths to value realization.",
    keywords: [
      "secondary investments",
      "PE secondaries",
      "private equity secondaries",
      "LP secondary investments",
      "GP-led secondaries",
      "continuation funds",
    ],
    minInvestment: "$100,000",
    typicalHorizon: "3-5 years",
    riskLevel: "medium",
    relatedTypes: ["private-equity", "growth-equity"],
  },
  {
    slug: "co-investments",
    name: "Co-Investments",
    description:
      "Invest directly alongside leading private equity sponsors in specific transactions.",
    longDescription:
      "Co-investments allow investors to participate directly in specific transactions alongside experienced private equity sponsors, typically without management fees or carried interest. DarkAlpha Capital curates co-investment opportunities offering direct exposure to high-conviction investments from top-tier sponsors. Our co-investment strategy emphasizes thorough due diligence, alignment with sponsors, and attractive risk-adjusted returns.",
    keywords: [
      "co-investments",
      "direct co-investments",
      "PE co-investments",
      "sponsor co-investments",
      "direct investments",
      "co-invest opportunities",
    ],
    minInvestment: "$250,000",
    typicalHorizon: "4-6 years",
    riskLevel: "medium",
    relatedTypes: ["private-equity", "growth-equity"],
  },
];

/**
 * Get an investment type by its slug
 */
export function getInvestmentTypeBySlug(slug: string): InvestmentType | undefined {
  return INVESTMENT_TYPES.find((type) => type.slug === slug);
}

/**
 * Get related investment types for a given type
 */
export function getRelatedInvestmentTypes(slug: string): InvestmentType[] {
  const investmentType = getInvestmentTypeBySlug(slug);
  if (!investmentType?.relatedTypes) return [];

  return investmentType.relatedTypes
    .map((relatedSlug) => getInvestmentTypeBySlug(relatedSlug))
    .filter((t): t is InvestmentType => t !== undefined);
}

/**
 * Get all investment type slugs for static params generation
 */
export function getAllInvestmentTypeSlugs(): string[] {
  return INVESTMENT_TYPES.map((type) => type.slug);
}

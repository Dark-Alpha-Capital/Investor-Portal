import type { Sector } from "@/types/seo";

/**
 * Investment sectors for programmatic SEO pages
 */
export const SECTORS: Sector[] = [
  {
    slug: "technology",
    name: "Technology",
    description:
      "Invest in cutting-edge technology companies driving digital transformation and innovation.",
    longDescription:
      "The technology sector encompasses companies at the forefront of digital innovation, including software, artificial intelligence, cloud computing, cybersecurity, and enterprise solutions. DarkAlpha Capital provides accredited investors with exclusive access to high-growth technology investments, from early-stage ventures to established market leaders. Our technology portfolio focuses on companies with strong competitive moats, recurring revenue models, and clear paths to profitability.",
    keywords: [
      "technology investments",
      "tech private equity",
      "software investments",
      "AI investments",
      "SaaS investments",
      "venture capital technology",
    ],
    relatedSectors: ["financial-services", "healthcare"],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    description:
      "Access investment opportunities in healthcare innovation, biotech, and medical services.",
    longDescription:
      "The healthcare sector offers compelling investment opportunities driven by demographic trends, technological advancement, and increasing healthcare spending. DarkAlpha Capital curates investments across healthcare services, medical devices, biotechnology, and digital health. Our healthcare investment strategy focuses on companies addressing unmet medical needs, improving patient outcomes, and delivering cost-effective care solutions.",
    keywords: [
      "healthcare investments",
      "biotech private equity",
      "medical device investments",
      "healthcare venture capital",
      "digital health investments",
      "life sciences investments",
    ],
    relatedSectors: ["technology", "consumer"],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description:
      "Diversify your portfolio with institutional-quality real estate investments.",
    longDescription:
      "Real estate investments provide portfolio diversification, inflation protection, and attractive risk-adjusted returns. DarkAlpha Capital offers access to institutional-quality real estate opportunities across commercial, residential, and specialty property types. Our real estate investment strategy emphasizes properties with strong fundamentals, value-add potential, and experienced operating partners.",
    keywords: [
      "real estate investments",
      "commercial real estate",
      "real estate private equity",
      "property investments",
      "REIT alternatives",
      "real estate syndication",
    ],
    relatedSectors: ["financial-services", "consumer"],
  },
  {
    slug: "consumer",
    name: "Consumer",
    description:
      "Invest in consumer brands and retail companies shaping modern lifestyles.",
    longDescription:
      "The consumer sector encompasses companies serving evolving consumer preferences, from direct-to-consumer brands to retail technology and consumer services. DarkAlpha Capital identifies consumer investments with strong brand equity, loyal customer bases, and scalable business models. Our consumer investment focus includes emerging brands with digital-first strategies and established companies undergoing transformation.",
    keywords: [
      "consumer investments",
      "retail private equity",
      "DTC brand investments",
      "consumer goods investments",
      "e-commerce investments",
      "consumer services",
    ],
    relatedSectors: ["technology", "healthcare"],
  },
  {
    slug: "financial-services",
    name: "Financial Services",
    description:
      "Participate in the evolution of financial services and fintech innovation.",
    longDescription:
      "The financial services sector is undergoing rapid transformation driven by technology, regulation, and changing consumer expectations. DarkAlpha Capital provides access to investments in fintech, specialty finance, insurance, and asset management. Our financial services investment strategy targets companies leveraging technology to improve financial access, reduce costs, and enhance the customer experience.",
    keywords: [
      "fintech investments",
      "financial services private equity",
      "banking investments",
      "insurance investments",
      "asset management investments",
      "payments investments",
    ],
    relatedSectors: ["technology", "real-estate"],
  },
  {
    slug: "industrials",
    name: "Industrials",
    description:
      "Access investments in manufacturing, logistics, and industrial technology.",
    longDescription:
      "The industrials sector offers investment opportunities in companies driving efficiency and innovation across manufacturing, logistics, and infrastructure. DarkAlpha Capital focuses on industrial investments benefiting from automation, supply chain optimization, and sustainability trends. Our industrial investment strategy emphasizes companies with market-leading positions, operational excellence, and growth potential.",
    keywords: [
      "industrial investments",
      "manufacturing private equity",
      "logistics investments",
      "industrial technology",
      "supply chain investments",
      "infrastructure investments",
    ],
    relatedSectors: ["technology", "real-estate"],
  },
  {
    slug: "energy",
    name: "Energy",
    description:
      "Invest in the energy transition and sustainable energy solutions.",
    longDescription:
      "The energy sector presents compelling investment opportunities driven by the global transition to cleaner energy sources. DarkAlpha Capital curates investments across renewable energy, energy storage, grid infrastructure, and energy efficiency. Our energy investment strategy focuses on companies accelerating decarbonization while delivering attractive returns to investors.",
    keywords: [
      "energy investments",
      "renewable energy private equity",
      "clean energy investments",
      "solar investments",
      "energy storage investments",
      "sustainable energy",
    ],
    relatedSectors: ["technology", "industrials"],
  },
];

/**
 * Get a sector by its slug
 */
export function getSectorBySlug(slug: string): Sector | undefined {
  return SECTORS.find((sector) => sector.slug === slug);
}

/**
 * Get related sectors for a given sector
 */
export function getRelatedSectors(slug: string): Sector[] {
  const sector = getSectorBySlug(slug);
  if (!sector?.relatedSectors) return [];

  return sector.relatedSectors
    .map((relatedSlug) => getSectorBySlug(relatedSlug))
    .filter((s): s is Sector => s !== undefined);
}

/**
 * Get all sector slugs for static params generation
 */
export function getAllSectorSlugs(): string[] {
  return SECTORS.map((sector) => sector.slug);
}

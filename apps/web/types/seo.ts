import type { Metadata } from "@/types/metadata";

/**
 * Site configuration for SEO
 */
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  twitterHandle?: string;
  locale: string;
}

/**
 * Parameters for generating page metadata
 */
export interface PageMetaParams {
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  keywords?: string[];
}

/**
 * Breadcrumb item for navigation and structured data
 */
export interface BreadcrumbItem {
  name: string;
  href: string;
}

/**
 * JSON-LD Organization schema data
 */
export interface OrganizationJsonLd {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  description: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    telephone?: string;
    email?: string;
    contactType: string;
  };
}

/**
 * JSON-LD WebPage schema data
 */
export interface WebPageJsonLd {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
  breadcrumb?: BreadcrumbListJsonLd;
}

/**
 * JSON-LD BreadcrumbList schema data
 */
export interface BreadcrumbListJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

/**
 * JSON-LD FAQPage schema data
 */
export interface FAQPageJsonLd {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

/**
 * JSON-LD FinancialService schema data (for investment pages)
 */
export interface FinancialServiceJsonLd {
  "@context": "https://schema.org";
  "@type": "FinancialService";
  name: string;
  description: string;
  url: string;
  serviceType?: string;
  areaServed?: string;
  provider?: {
    "@type": "Organization";
    name: string;
  };
}

/**
 * Sector data for programmatic SEO pages
 */
export interface Sector {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  keywords: string[];
  icon?: string;
  relatedSectors?: string[];
}

/**
 * Investment type data for programmatic SEO pages
 */
export interface InvestmentType {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  keywords: string[];
  minInvestment?: string;
  typicalHorizon?: string;
  riskLevel?: "low" | "medium" | "high";
  relatedTypes?: string[];
}

/**
 * Union type for all JSON-LD schemas
 */
export type JsonLdSchema =
  | OrganizationJsonLd
  | WebPageJsonLd
  | BreadcrumbListJsonLd
  | FAQPageJsonLd
  | FinancialServiceJsonLd;

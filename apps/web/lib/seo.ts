import type { Metadata } from "@/types/metadata";
import type {
  SiteConfig,
  PageMetaParams,
  BreadcrumbItem,
  OrganizationJsonLd,
  WebPageJsonLd,
  BreadcrumbListJsonLd,
  FAQPageJsonLd,
  FinancialServiceJsonLd,
} from "@/types/seo";

/**
 * Site-wide SEO configuration
 */
export const siteConfig: SiteConfig = {
  name: "DarkAlpha Capital",
  description:
    "Private equity and venture capital investment platform for accredited investors. Access exclusive investment opportunities in technology, healthcare, real estate, and more.",
  url: "https://investors.darkalphacapital.com",
  ogImage: "/og-default.png",
  twitterHandle: "@darkalphacap",
  locale: "en_US",
};

/**
 * Generate page metadata with sensible defaults
 */
export function generatePageMetadata({
  title,
  description,
  image,
  noIndex = false,
  canonical,
  keywords,
}: PageMetaParams): Metadata {
  const fullTitle = title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords?.join(", "),
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonical || undefined,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical || siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image || siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };

  return metadata;
}

/**
 * Generate noindex metadata for protected pages
 */
export function generateNoIndexMetadata(title: string): Metadata {
  return generatePageMetadata({
    title,
    description: siteConfig.description,
    noIndex: true,
  });
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationJsonLd(): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      "https://www.linkedin.com/company/darkalphacapital",
      // Add other social profiles as needed
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@darkalphacapital.com",
      contactType: "customer service",
    },
  };
}

/**
 * Generate WebPage JSON-LD schema
 */
export function generateWebPageJsonLd(
  name: string,
  description: string,
  url: string,
  breadcrumbs?: BreadcrumbItem[]
): WebPageJsonLd {
  const jsonLd: WebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${siteConfig.url}${url}`,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLd.breadcrumb = generateBreadcrumbJsonLd(breadcrumbs);
  }

  return jsonLd;
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[]
): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  };
}

/**
 * Generate FAQPage JSON-LD schema
 */
export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[]
): FAQPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate FinancialService JSON-LD schema for investment pages
 */
export function generateFinancialServiceJsonLd(
  name: string,
  description: string,
  url: string,
  serviceType?: string
): FinancialServiceJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name,
    description,
    url: `${siteConfig.url}${url}`,
    serviceType: serviceType || "Investment Services",
    areaServed: "United States",
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };
}

/**
 * Convert JSON-LD object to script tag content
 */
export function jsonLdToString(jsonLd: object): string {
  return JSON.stringify(jsonLd);
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

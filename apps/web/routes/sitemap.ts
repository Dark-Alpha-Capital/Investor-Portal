import type { MetadataRoute } from "next";
import { createClient } from "@/prismicio";
import { siteConfig } from "@/lib/seo";
import { getAllSectorSlugs } from "@/lib/constants/sectors";
import { getAllInvestmentTypeSlugs } from "@/lib/constants/investment-types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();
  const currentDate = new Date().toISOString().split("T")[0];

  // Static marketing pages with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/offerings`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/how-it-works`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/investment-process`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/track-record`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/frequently-asked-questions`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/terms-conditions`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Programmatic SEO: Sector pages
  const sectorRoutes: MetadataRoute.Sitemap = getAllSectorSlugs().map(
    (slug) => ({
      url: `${siteConfig.url}/sectors/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  // Programmatic SEO: Investment type pages
  const investmentRoutes: MetadataRoute.Sitemap = getAllInvestmentTypeSlugs().map(
    (slug) => ({
      url: `${siteConfig.url}/investments/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  // Fetch dynamic Prismic pages
  let prismicRoutes: MetadataRoute.Sitemap = [];
  try {
    const pages = await client.getAllByType("page");
    prismicRoutes = pages.map((page) => ({
      url: `${siteConfig.url}/${page.uid}`,
      lastModified: page.last_publication_date || currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    // Prismic pages will be omitted if there's an error
    console.error("Error fetching Prismic pages for sitemap:", error);
  }

  return [
    ...staticRoutes,
    ...sectorRoutes,
    ...investmentRoutes,
    ...prismicRoutes,
  ];
}

import type { MetadataRoute } from "@/types/metadata";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/offerings",
          "/how-it-works",
          "/investment-process",
          "/track-record",
          "/frequently-asked-questions",
          "/sectors/",
          "/investments/",
          "/privacy-policy",
          "/terms-conditions",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/onboarding/",
          "/profile/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/",
          "/slice-simulator",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/about",
          "/contact",
          "/offerings",
          "/how-it-works",
          "/investment-process",
          "/track-record",
          "/frequently-asked-questions",
          "/sectors/",
          "/investments/",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/onboarding/",
          "/profile/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

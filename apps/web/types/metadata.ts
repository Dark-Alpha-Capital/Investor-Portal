export type Metadata = {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  keywords?: string | string[];
  authors?: Array<{ name: string }>;
  creator?: string;
  publisher?: string;
  metadataBase?: URL;
  alternates?: { canonical?: string };
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  robots?: Record<string, unknown> | string;
};

export type MetadataRoute = {
  Sitemap: Array<{
    url: string;
    lastModified?: string | Date;
    changeFrequency?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority?: number;
  }>;
  Robots: {
    rules:
      | {
          userAgent?: string | string[];
          allow?: string | string[];
          disallow?: string | string[];
        }
      | Array<{
          userAgent?: string | string[];
          allow?: string | string[];
          disallow?: string | string[];
        }>;
    sitemap?: string | string[];
    host?: string;
  };
};

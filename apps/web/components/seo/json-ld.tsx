import type { JsonLdSchema } from "@/types/seo";

interface JsonLdProps {
  data: JsonLdSchema | JsonLdSchema[];
}

/**
 * Component to render JSON-LD structured data in the page head
 * Use this component in page.tsx files for SEO structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  );
}

/**
 * Combine multiple JSON-LD schemas into a single array for the page
 */
export function combineJsonLd(...schemas: JsonLdSchema[]): JsonLdSchema[] {
  return schemas;
}

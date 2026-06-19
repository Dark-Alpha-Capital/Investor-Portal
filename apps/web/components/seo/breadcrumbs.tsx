import { AppLink as Link } from "@/components/app-link";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/types/seo";
import { generateBreadcrumbJsonLd, siteConfig } from "@/lib/seo";
import { JsonLd } from "./json-ld";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * SEO-friendly breadcrumb navigation with JSON-LD structured data
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // Always include home as the first item
  const fullItems: BreadcrumbItem[] = [{ name: "Home", href: "/" }, ...items];

  const jsonLd = generateBreadcrumbJsonLd(fullItems);

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center space-x-1">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1;
            const isFirst = index === 0;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                )}
                {isLast ? (
                  <span
                    className="font-medium text-foreground truncate max-w-[200px]"
                    aria-current="page"
                  >
                    {isFirst ? <Home className="h-4 w-4" /> : item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors truncate max-w-[200px]"
                  >
                    {isFirst ? <Home className="h-4 w-4" /> : item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

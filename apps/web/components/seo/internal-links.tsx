import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getRelatedSectors, SECTORS } from "@/lib/constants/sectors";
import {
  getRelatedInvestmentTypes,
  INVESTMENT_TYPES,
} from "@/lib/constants/investment-types";

interface RelatedSectorLinksProps {
  currentSector?: string;
  limit?: number;
  className?: string;
}

/**
 * Display links to related sectors for internal linking
 */
export function RelatedSectorLinks({
  currentSector,
  limit = 3,
  className = "",
}: RelatedSectorLinksProps) {
  const sectors = currentSector
    ? getRelatedSectors(currentSector)
    : SECTORS.slice(0, limit);

  if (sectors.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">
        {currentSector ? "Related Sectors" : "Explore Investment Sectors"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.slice(0, limit).map((sector) => (
          <Link
            key={sector.slug}
            href={`/sectors/${sector.slug}`}
            className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {sector.name}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {sector.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface RelatedInvestmentLinksProps {
  currentType?: string;
  limit?: number;
  className?: string;
}

/**
 * Display links to related investment types for internal linking
 */
export function RelatedInvestmentLinks({
  currentType,
  limit = 3,
  className = "",
}: RelatedInvestmentLinksProps) {
  const types = currentType
    ? getRelatedInvestmentTypes(currentType)
    : INVESTMENT_TYPES.slice(0, limit);

  if (types.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">
        {currentType ? "Related Investment Types" : "Explore Investment Types"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.slice(0, limit).map((type) => (
          <Link
            key={type.slug}
            href={`/investments/${type.slug}`}
            className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {type.name}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {type.description}
            </p>
            {type.minInvestment && (
              <p className="text-xs text-muted-foreground mt-2">
                Min. Investment: {type.minInvestment}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface CrossLinkSectionProps {
  showSectors?: boolean;
  showInvestments?: boolean;
  className?: string;
}

/**
 * Cross-linking section to display both sectors and investment types
 */
export function CrossLinkSection({
  showSectors = true,
  showInvestments = true,
  className = "",
}: CrossLinkSectionProps) {
  return (
    <section className={`py-12 ${className}`}>
      <div className="space-y-12">
        {showSectors && (
          <RelatedSectorLinks limit={4} />
        )}
        {showInvestments && (
          <RelatedInvestmentLinks limit={4} />
        )}
      </div>
    </section>
  );
}

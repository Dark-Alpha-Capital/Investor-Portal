import { Suspense } from "react";
import { DealsMarketplaceContent } from "./components/deals-marketplace-content";
import { DealsMarketplaceSkeleton } from "@/components/skeleton/deals-marketplace-skeleton";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  sector?: string;
  view?: string;
}>;

/**
 * Deals Marketplace Page
 *
 * Uses Next.js Cache Components pattern:
 * - Static shell (header) is prerendered
 * - Dynamic content (deals list) is streamed with Suspense
 * - Data is cached per-user with cacheLife and cacheTag
 */
export default function DealsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Deal Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover investment opportunities tailored to your profile
        </p>
      </div>

      {/* Dynamic content - streamed */}
      <Suspense fallback={<DealsMarketplaceSkeleton />}>
        <DealsMarketplaceContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

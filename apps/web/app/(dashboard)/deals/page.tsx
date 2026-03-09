import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { DealsMarketplace } from "./components/deals-marketplace";
import { cacheLife, cacheTag } from "next/cache";
import { DealsMarketplaceSkeleton } from "@/components/skeleton/deals-marketplace-skeleton";
import { getMarketplaceDeals } from "@repo/db/queries";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  sector?: string;
  view?: string;
}>;

/**
 * Deals Marketplace Main Component - Server Component
 * Fetches and renders the marketplace deals with caching
 */
async function DealsMarketplaceMain({
  userId,
  page,
  search,
  status,
  sector,
}: {
  userId: string;
  page: number;
  search: string | undefined;
  status: string | undefined;
  sector: string | undefined;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace-deals-${userId}`);

  const initialData = await getMarketplaceDeals({
    userId,
    page,
    limit: 12,
    search,
    status,
    sector,
  });

  // Pass initial data to client component
  return <DealsMarketplace initialData={initialData} />;
}

/**
 * Deals Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: DealsContent logic wrapped in Suspense (streamed at request time)
 *
 * This component:
 * - Handles runtime data (searchParams, session check)
 * - Calls cached data fetching function
 * - Renders the marketplace deals
 */
async function DealsContent({ searchParams }: { searchParams: SearchParams }) {
  // Auth check - runtime data access
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || undefined;
  const status =
    params.status && params.status !== "all" ? params.status : undefined;
  const sector =
    params.sector && params.sector !== "all" ? params.sector : undefined;

  return (
    <DealsMarketplaceMain
      userId={userId}
      page={page}
      search={search}
      status={status}
      sector={sector}
    />
  );
}

/**
 * Deals Marketplace Page
 *
 * Uses Next.js Cache Components pattern:
 * - Static shell (header) is prerendered
 * - Dynamic content (deals list) is streamed with Suspense
 * - Data is cached per-user with cacheLife and cacheTag
 */
const DealsPage = ({ searchParams }: { searchParams: SearchParams }) => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Static shell - prerendered */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            Deal Marketplace
          </h1>
          <p className="text-muted-foreground text-base">
            Discover investment opportunities tailored to your profile
          </p>
        </div>

        {/* Dynamic content - streamed */}
        <Suspense fallback={<DealsMarketplaceSkeleton />}>
          <DealsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
};

export default DealsPage;

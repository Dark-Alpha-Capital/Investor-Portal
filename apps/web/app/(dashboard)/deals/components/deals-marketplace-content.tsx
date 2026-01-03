import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { getMarketplaceDealsCached } from "../lib/get-marketplace-deals-cached";
import { DealsMarketplace } from "./deals-marketplace";
import { cacheLife, cacheTag } from "next/cache";
import React, { Suspense } from "react";
import { DealsMarketplaceSkeleton } from "@/components/skeleton/deals-marketplace-skeleton";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  sector?: string;
  view?: string;
}>;

type DealsMarketplaceContentProps = {
  searchParams: SearchParams;
};

/**
 * Server component that handles runtime data (searchParams, session).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (searchParams) and performs auth checks.
 */
export async function DealsMarketplaceContent({
  searchParams,
}: DealsMarketplaceContentProps) {
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

  // Call cached function with extracted values
  // Arguments (including userId) become part of cache key

  return (
    <Suspense fallback={<DealsMarketplaceSkeleton />}>
      <FetchDealMarketplaceContent
        userId={userId}
        page={page}
        search={search}
        status={status}
        sector={sector}
      />
    </Suspense>
  );
}

async function FetchDealMarketplaceContent({
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

  const initialData = await getMarketplaceDealsCached({
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

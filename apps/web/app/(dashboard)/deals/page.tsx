import React, { Suspense } from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DealsMarketplace } from "./components/deals-marketplace";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-9 w-full max-w-sm bg-muted rounded-md animate-pulse" />
          <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse" />
          <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse" />
        </div>
        <div className="h-9 w-[88px] bg-muted rounded-md animate-pulse" />
      </div>
      {/* Results count skeleton */}
      <div className="h-5 w-24 bg-muted rounded animate-pulse" />
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[280px] bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  sector?: string;
  view?: string;
}>;

const DealsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Get search params for prefetching
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || undefined;
  const status = params.status && params.status !== "all" ? params.status : undefined;
  const sector = params.sector && params.sector !== "all" ? params.sector : undefined;

  // Prefetch the deals query on the server
  prefetch(
    trpc.deals.getMarketplaceDeals.queryOptions({
      page,
      limit: 12,
      search,
      status,
      sector,
    })
  );

  return (
    <HydrateClient>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Deal Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Discover investment opportunities tailored to your profile
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <DealsMarketplace />
        </Suspense>
      </div>
    </HydrateClient>
  );
};

export default DealsPage;

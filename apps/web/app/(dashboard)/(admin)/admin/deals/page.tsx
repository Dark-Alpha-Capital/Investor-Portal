import React from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DealsTable } from "./components/deals-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type SearchParams = Promise<{
  dealsPage?: string;
  dealsSearch?: string;
  dealsStatus?: string;
  dealsVisibility?: string;
}>;

const DealsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get search params for prefetching
  const params = await searchParams;
  const page = parseInt(params.dealsPage || "1", 10);
  const search = params.dealsSearch || undefined;
  const status = params.dealsStatus && params.dealsStatus !== "all" ? params.dealsStatus : undefined;
  const visibility = params.dealsVisibility && params.dealsVisibility !== "all" ? params.dealsVisibility : undefined;

  // Prefetch the deals query on the server with cache settings
  prefetch({
    ...trpc.admin.getDeals.queryOptions({
      page,
      limit: 12,
      search,
      status,
      visibility,
    }),
    staleTime: 2 * 60 * 1000,  // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000,    // Keep in cache for 10 minutes
  });

  return (
    <HydrateClient>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage investment deals
            </p>
          </div>
          <Link href="/admin/deals/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Deal
            </Button>
          </Link>
        </div>

        <DealsTable />
      </div>
    </HydrateClient>
  );
};

export default DealsPage;

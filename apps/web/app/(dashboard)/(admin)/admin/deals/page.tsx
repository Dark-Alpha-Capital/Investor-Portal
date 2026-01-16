import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealsTableSkeleton } from "@/components/skeleton/deals-table-skeleton";
import { DealsTable } from "@/components/deals-table";
import { getAdminDeals } from "@repo/db/queries";
import { cacheLife, cacheTag } from "next/cache";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";

type SearchParams = Promise<{
  dealsPage?: string;
  dealsSearch?: string;
  dealsStatus?: string;
  dealsVisibility?: string;
}>;

/**
 * Admin Deals Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Header with title and "Create Deal" button (prerendered)
 * - Dynamic content: DealsTableWrapper wrapped in Suspense (streamed at request time)
 *
 * The DealsTableWrapper component:
 * - Handles runtime data (searchParams)
 * - Calls tRPC query with cache directives
 * - Passes initial data to client DealsTable component
 */
const DealsPage = ({ searchParams }: { searchParams: SearchParams }) => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Static shell - prerendered automatically */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Deals Management
          </h1>
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

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<DealsTableSkeleton />}>
        <DealsTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

async function DealsTableWrapper({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Extract values from searchParams - runtime data access
  const [params, session] = await Promise.all([searchParams, authSession()]);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const page = parseInt(params.dealsPage || "1", 10);
  const search = params.dealsSearch || undefined;
  const status =
    params.dealsStatus && params.dealsStatus !== "all"
      ? params.dealsStatus
      : undefined;
  const visibility =
    params.dealsVisibility && params.dealsVisibility !== "all"
      ? params.dealsVisibility
      : undefined;

  // Pass initial data to client component
  return (
    <FetchDealsDataWrapper
      page={page}
      limit={12}
      search={search}
      status={status}
      visibility={visibility}
    />
  );
}

async function FetchDealsDataWrapper({
  page,
  limit,
  search,
  status,
  visibility,
}: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  visibility?: string;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-deals");

  // Call query function directly
  const result = await getAdminDeals({
    page,
    limit,
    search,
    status,
    visibility,
  });

  return <DealsTable initialData={result} />;
}

export default DealsPage;

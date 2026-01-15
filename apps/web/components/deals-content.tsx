import { getDealsCached } from "../lib/get-deals-cached";
import { DealsTable } from "./deals-table";
import { cacheLife, cacheTag } from "next/cache";

type SearchParams = Promise<{
  dealsPage?: string;
  dealsSearch?: string;
  dealsStatus?: string;
  dealsVisibility?: string;
}>;

type DealsContentProps = {
  searchParams: SearchParams;
};

/**
 * Server component that handles runtime data (searchParams, session).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (searchParams) and performs auth checks.
 */
export async function DealsContent({ searchParams }: DealsContentProps) {
  // Auth is handled in the layout - no need to check here
  // Extract values from searchParams - runtime data access
  const params = await searchParams;
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

  // Return the data fetching component directly - Suspense is handled by the page component
  return (
    <DealsTableWrapper
      page={page}
      search={search}
      status={status}
      visibility={visibility}
    />
  );
}

async function DealsTableWrapper({
  page,
  search,
  status,
  visibility,
}: {
  page: number;
  search: string | undefined;
  status: string | undefined;
  visibility: string | undefined;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-deals");

  // Call cached function with extracted values
  // Arguments become part of cache key
  const initialData = await getDealsCached({
    page,
    limit: 12,
    search,
    status,
    visibility,
  });

  // Pass initial data to client component
  return <DealsTable initialData={initialData} />;
}

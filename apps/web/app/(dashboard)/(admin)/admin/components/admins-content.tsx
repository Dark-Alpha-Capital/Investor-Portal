import { getAdminsCached } from "../lib/get-admins-cached";
import { AdminsTableClient } from "./admins-table-client";

type SearchParams = Promise<{
  adminsPage?: string;
  adminsSearch?: string;
  adminsVerified?: string;
  adminsStatus?: string;
}>;

type AdminsContentProps = {
  searchParams: SearchParams;
};

/**
 * Server component that handles runtime data (searchParams).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (searchParams).
 */
export async function AdminsContent({ searchParams }: AdminsContentProps) {
  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const page = parseInt(params.adminsPage || "1", 10);
  const search = params.adminsSearch || undefined;
  const verified =
    params.adminsVerified && params.adminsVerified !== "all"
      ? params.adminsVerified
      : undefined;
  const status =
    params.adminsStatus && params.adminsStatus !== "all"
      ? params.adminsStatus
      : undefined;

  // Call cached function with extracted values
  // Arguments become part of cache key
  const initialData = await getAdminsCached({
    page,
    limit: 12,
    search,
    verified,
    status,
  });

  // Pass initial data to client component
  return <AdminsTableClient initialData={initialData} />;
}

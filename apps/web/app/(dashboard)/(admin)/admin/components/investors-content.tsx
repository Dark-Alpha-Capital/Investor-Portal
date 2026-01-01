import { getInvestorsCached } from "../lib/get-investors-cached";
import { InvestorsTableClient } from "./investors-table-client";

type SearchParams = Promise<{
  investorsPage?: string;
  investorsSearch?: string;
  investorsKycStatus?: string;
  investorsVerified?: string;
}>;

type InvestorsContentProps = {
  searchParams: SearchParams;
};

/**
 * Server component that handles runtime data (searchParams).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (searchParams).
 */
export async function InvestorsContent({ searchParams }: InvestorsContentProps) {
  // Extract values from searchParams - runtime data access
  const params = await searchParams;
  const page = parseInt(params.investorsPage || "1", 10);
  const search = params.investorsSearch || undefined;
  const kycStatus =
    params.investorsKycStatus && params.investorsKycStatus !== "all"
      ? params.investorsKycStatus
      : undefined;
  const verified =
    params.investorsVerified && params.investorsVerified !== "all"
      ? params.investorsVerified
      : undefined;

  // Call cached function with extracted values
  // Arguments become part of cache key
  const initialData = await getInvestorsCached({
    page,
    limit: 12,
    search,
    kycStatus,
    verified,
  });

  // Pass initial data to client component
  return <InvestorsTableClient initialData={initialData} />;
}

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealsContent } from "./components/deals-content";
import { DealsTableSkeleton } from "@/components/skeleton/deals-table-skeleton";

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
 * - Dynamic content: DealsContent wrapped in Suspense (streamed at request time)
 *
 * The DealsContent component:
 * - Handles runtime data (searchParams, session check)
 * - Calls cached data fetching function
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
      {/* DealsContent handles runtime data (searchParams, session) */}
      {/* and calls cached data fetching function */}
      <Suspense fallback={<DealsTableSkeleton />}>
        <DealsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default DealsPage;

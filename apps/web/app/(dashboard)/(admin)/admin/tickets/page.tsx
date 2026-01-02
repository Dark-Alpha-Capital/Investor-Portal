import { Suspense } from "react";
import { TicketsDashboardContent } from "./components/tickets-dashboard-content";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
}>;

/**
 * Admin Tickets Dashboard Page
 *
 * Allows admins to view and manage all investor support tickets.
 */
export default function TicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground mt-2">
          Manage investor support requests and inquiries
        </p>
      </div>

      {/* Dynamic content - streamed at request time */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading tickets...
            </div>
          </div>
        }
      >
        <TicketsDashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

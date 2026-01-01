import { Suspense } from "react";
import { AdminDashboardContent } from "./components/admin-dashboard-content";

type SearchParams = Promise<{
  // Investors params
  investorsPage?: string;
  investorsSearch?: string;
  investorsKycStatus?: string;
  investorsVerified?: string;
  // Admins params
  adminsPage?: string;
  adminsSearch?: string;
  adminsVerified?: string;
  adminsStatus?: string;
}>;

/**
 * Admin Dashboard Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Header with title (prerendered)
 * - Dynamic content: AdminDashboardContent wrapped in Suspense (streamed at request time)
 *
 * Auth is handled in the layout at apps/web/app/(dashboard)/(admin)/layout.tsx
 *
 * The AdminDashboardContent component:
 * - Handles runtime data (searchParams, session)
 * - Fetches both investors and admins data in parallel using a single tRPC endpoint
 * - Renders tabs with data passed to client table components
 */
export default function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users and monitor system activity
        </p>
      </div>

      {/* Dynamic content - streamed at request time */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading dashboard data...
            </div>
          </div>
        }
      >
        <AdminDashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

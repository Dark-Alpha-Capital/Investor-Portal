import { Suspense } from "react";
import { SupportPageContent } from "./components/support-page-content";

type SearchParams = Promise<{
  page?: string;
  status?: string;
}>;

/**
 * Investor Support Page
 *
 * Allows investors to create and track their support tickets.
 */
export default function SupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Static shell - prerendered */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground mt-2">
          Get help with your account, documents, or investments
        </p>
      </div>

      {/* Dynamic content - streamed at request time */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        }
      >
        <SupportPageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

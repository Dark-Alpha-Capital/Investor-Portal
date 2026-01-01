import { Suspense } from "react";
import { DealCurationData } from "../components/deal-curation-data";
import BackButton from "@/components/back-button";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * Curate Deal Page
 *
 * Auth is handled by the admin layout at (admin)/layout.tsx
 * This page uses Suspense to stream the deal curation data.
 */
export default async function CurateDealPage({ params }: PageProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Static shell - prerendered */}
      <div className="mb-8 mt-6 flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curate Deal</h1>
          <p className="text-muted-foreground mt-2">
            Select which investors can see this deal
          </p>
        </div>
      </div>

      {/* Dynamic content - streamed */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading investors...
            </div>
          </div>
        }
      >
        <DealCurationData params={params} />
      </Suspense>
    </div>
  );
}

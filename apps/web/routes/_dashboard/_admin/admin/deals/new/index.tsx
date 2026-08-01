import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import dynamic from "@/lib/helpers/lazy-component";

const DealForm = dynamic(
  () => import("@/components/deals-deal-form").then((m) => m.DealForm),
  { ssr: false }
);
export const Route = createFileRoute("/_dashboard/_admin/admin/deals/new/")({
  component: NewDealPage,
});

function NewDealPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Deal</h1>
        <p className="text-muted-foreground mt-2">
          Add a new investment deal to the platform
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <DealForm />
      </Suspense>
    </div>
  );
}

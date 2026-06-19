import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DealForm } from "@/components/deals-deal-form";

export const Route = createFileRoute("/(dashboard)/(admin)/admin/deals/new/")({
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

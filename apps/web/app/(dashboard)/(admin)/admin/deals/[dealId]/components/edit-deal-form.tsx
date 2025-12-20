import { Suspense } from "react";
import { redirect } from "next/navigation";
import { caller } from "@/trpc/server";
import { EditDealFormClient } from "./edit-deal-form-client";

type EditDealFormProps = {
  dealId: string;
};

export async function EditDealForm({ dealId }: EditDealFormProps) {
  try {
    const result = await caller.deals.getById({ dealId });

    if (!result.success || !result.deal) {
      redirect("/admin/deals");
    }

    const deal = result.deal;

    // Convert null values to undefined for form compatibility
    const formData = {
      name: deal.name,
      slug: deal.slug ?? undefined,
      description: deal.description ?? undefined,
      teaserSummary: deal.teaserSummary ?? undefined,
      sector: deal.sector ?? undefined,
      geography: deal.geography ?? undefined,
      dealType: deal.dealType ?? undefined,
      targetRaise: deal.targetRaise ?? undefined,
      minInvestment: deal.minInvestment ?? undefined,
      targetIrr: deal.targetIrr ?? undefined,
      targetMoic: deal.targetMoic ?? undefined,
      status: deal.status,
      visibility: deal.visibility,
      coverImageUrl: deal.coverImageUrl ?? undefined,
      launchDate: deal.launchDate ?? undefined,
      closeDate: deal.closeDate ?? undefined,
    };

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal...
            </div>
          </div>
        }
      >
        <EditDealFormClient dealId={dealId} initialData={formData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error fetching deal:", error);
    redirect("/admin/deals");
  }
}

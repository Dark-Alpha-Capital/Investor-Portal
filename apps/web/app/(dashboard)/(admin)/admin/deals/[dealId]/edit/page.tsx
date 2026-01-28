import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import BackButton from "@/components/back-button";
import { DealForm } from "@/components/deals-deal-form";
import { getDealByIdForEdit } from "@repo/db/queries";
import { authSession } from "@/app/(auth)/auth";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * Edit Deal Page
 *
 * Auth is handled in the FetchEditDeal component
 * This page uses Suspense to stream the deal data.
 */
const EditDealPage = async ({ params }: PageProps) => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Static shell - prerendered */}
      <BackButton />
      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Deal</h1>
        <p className="text-muted-foreground mt-2">Update deal information</p>
      </div>

      {/* Dynamic content - streamed */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal...
            </div>
          </div>
        }
      >
        <FetchEditDeal params={params} />
      </Suspense>
    </div>
  );
};

export default EditDealPage;

async function FetchEditDeal({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const [paramsData, sessionData] = await Promise.all([params, authSession()]);

  if (!sessionData?.user || sessionData.user.role !== "admin") {
    redirect("/login");
  }

  const { dealId } = paramsData;

  return <FetchEditDealWrapper dealId={dealId} />;
}

async function FetchEditDealWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  const result = await getDealByIdForEdit(dealId);

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

  return <DealForm dealId={dealId} initialData={formData} />;
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchAdminDealEditData } from "@/lib/server-fns/admin-route-data";
import BackButton from "@/components/back-button";
import { DealForm } from "@/components/deals-deal-form";
import type { AdminDealEditFormData } from "@/lib/server-fns/admin-route-data";

export const Route = createFileRoute(
  "/(dashboard)/(admin)/admin/deals/$dealId/edit/",
)({
  loader: async ({ params }: { params: { dealId: string } }) => {
    const r = await fetchAdminDealEditData({
      data: { dealId: params.dealId },
    });
    if (r.tag === "missing") {
      throw redirect({ to: "/admin/deals" });
    }
    return { dealId: params.dealId, formData: r.formData };
  },
  component: AdminDealEditRoutePage,
});

function AdminDealEditRoutePage() {
  const { dealId, formData } = Route.useLoaderData();
  return <AdminDealEditInner dealId={dealId} formData={formData} />;
}

function AdminDealEditInner({
  dealId,
  formData,
}: {
  dealId: string;
  formData: AdminDealEditFormData;
}) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <BackButton />
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Edit Deal</h1>
        <p className="mt-2 text-muted-foreground">Update deal information</p>
      </div>

      <DealForm dealId={dealId} initialData={formData} />
    </div>
  );
}

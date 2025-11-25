"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DealForm } from "../../components/deal-form";
import { toast } from "sonner";

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  status:
    | "draft"
    | "coming_soon"
    | "live"
    | "closing"
    | "funded"
    | "exited"
    | "cancelled";
  visibility: "public" | "accredited" | "invite_only";
  coverImageUrl: string | null;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type EditDealFormProps = {
  dealId: string;
};

export function EditDealForm({ dealId }: EditDealFormProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`);
      const data = await response.json();

      if (data.success) {
        setDeal(data.deal);
      } else {
        toast.error(data.message || "Failed to fetch deal");
        router.push("/admin/deals");
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
      toast.error("Failed to fetch deal");
      router.push("/admin/deals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Deal updated successfully");
        router.push("/admin/deals");
      } else {
        toast.error(result.message || "Failed to update deal");
      }
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading deal...
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Deal not found</p>
      </div>
    );
  }

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
    <DealForm
      initialData={formData}
      onSubmit={handleSubmit}
      isLoading={isSaving}
    />
  );
}

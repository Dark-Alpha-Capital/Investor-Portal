"use client";

import { DealForm } from "../../components/deal-form";
import type { z } from "zod";
import { createDealSchema } from "@/lib/schemas/create-deal-schema";

type DealFormValues = z.infer<typeof createDealSchema>;

type EditDealFormClientProps = {
  dealId: string;
  initialData: Partial<DealFormValues>;
};

export function EditDealFormClient({
  dealId,
  initialData,
}: EditDealFormClientProps) {
  return <DealForm initialData={initialData} dealId={dealId} />;
}

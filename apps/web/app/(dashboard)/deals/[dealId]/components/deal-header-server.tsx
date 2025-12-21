import { caller } from "@/trpc/server";
import { DealHeader } from "./deal-header";
import { notFound } from "next/navigation";

type DealHeaderServerProps = {
  dealId: string;
};

export async function DealHeaderServer({ dealId }: DealHeaderServerProps) {
  try {
    const result = await caller.deals.getDealForView({ dealId });
    return (
      <DealHeader deal={result.deal} curationNote={result.curationNote} />
    );
  } catch (error: any) {
    if (error?.data?.code === "NOT_FOUND" || error?.data?.code === "FORBIDDEN") {
      notFound();
    }
    throw error;
  }
}


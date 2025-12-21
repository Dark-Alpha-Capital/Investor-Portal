import { caller } from "@/trpc/server";
import { DealInformation } from "./deal-information";

type DealInformationServerProps = {
  dealId: string;
};

export async function DealInformationServer({
  dealId,
}: DealInformationServerProps) {
  const result = await caller.deals.getDealForView({ dealId });
  return <DealInformation deal={result.deal} />;
}


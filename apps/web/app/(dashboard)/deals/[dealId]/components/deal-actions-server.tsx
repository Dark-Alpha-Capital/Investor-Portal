import { caller } from "@/trpc/server";
import { DealActions } from "./deal-actions";

type DealActionsServerProps = {
  dealId: string;
};

export async function DealActionsServer({
  dealId,
}: DealActionsServerProps) {
  const result = await caller.deals.getDealForView({ dealId });

  // Only show actions if user doesn't have an investment
  if (result.userInvestment) {
    return null;
  }

  return (
    <DealActions
      dealId={dealId}
      userInterest={result.userInterest}
      minInvestment={result.deal.minInvestment}
      permissions={result.permissions}
    />
  );
}


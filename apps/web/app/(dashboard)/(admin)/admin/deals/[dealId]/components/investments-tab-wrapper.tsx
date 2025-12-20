import { caller } from "@/trpc/server";
import { InvestmentsTab } from "./investments-tab";

export async function InvestmentsTabWrapper({ dealId }: { dealId: string }) {
  const [investmentsResult, interestsResult] = await Promise.all([
    caller.deals.getInvestments({ dealId }),
    caller.deals.getInterests({ dealId }),
  ]);

  return (
    <InvestmentsTab
      investments={investmentsResult.investments}
      interests={interestsResult.interests}
      dealId={dealId}
    />
  );
}


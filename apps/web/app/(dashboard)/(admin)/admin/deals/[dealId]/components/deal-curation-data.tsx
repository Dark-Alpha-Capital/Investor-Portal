import { caller } from "@/trpc/server";
import { DealCurationTabs } from "./deal-curation-tabs";

type DealCurationDataProps = {
  dealId: string;
};

export async function DealCurationData({ dealId }: DealCurationDataProps) {
  const [investorsResult, invitesResult] = await Promise.all([
    caller.deals.getInvestors(),
    caller.deals.getInvites({ dealId }),
  ]);

  return (
    <DealCurationTabs
      dealId={dealId}
      investors={investorsResult.investors}
      invites={invitesResult.invites}
    />
  );
}

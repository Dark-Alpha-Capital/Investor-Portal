import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDealInvitesCached } from "./get-deal-invites-cached";
import { getDealInterestsCached } from "./get-deal-interests-cached";
import { getDealInvestmentsCached } from "./get-deal-investments-cached";
import { getDealFilesCached } from "./get-deal-files-cached";

/**
 * Cached function to fetch all tab counts for a deal.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 * 
 * This combines multiple cached queries in parallel for efficiency.
 */
export async function getDealTabCountsCached(dealId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag(`deal-${dealId}-counts`);

  const [invitesResult, interestsResult, investmentsResult, filesResult] =
    await Promise.all([
      getDealInvitesCached(dealId),
      getDealInterestsCached(dealId),
      getDealInvestmentsCached(dealId),
      getDealFilesCached(dealId),
    ]);

  return {
    invitesCount: invitesResult.invites.length,
    interestsCount: interestsResult.interests.length,
    investmentsCount: investmentsResult.investments.length,
    filesCount: filesResult.files.length,
  };
}

export type DealTabCountsData = Awaited<ReturnType<typeof getDealTabCountsCached>>;


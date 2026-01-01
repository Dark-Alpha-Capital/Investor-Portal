import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal, investment, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cached function to fetch deal investments.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getDealInvestmentsCached(dealId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag(`deal-${dealId}-investments`);

  // Verify deal exists
  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRecord) {
    return {
      success: false as const,
      investments: [],
    };
  }

  // Get all investments for this deal with user info
  const investments = await db
    .select({
      id: investment.id,
      userId: investment.userId,
      committedAmount: investment.committedAmount,
      fundedAmount: investment.fundedAmount,
      currentValue: investment.currentValue,
      distributions: investment.distributions,
      status: investment.status,
      ownershipPercentage: investment.ownershipPercentage,
      committedDate: investment.committedDate,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(investment)
    .innerJoin(user, eq(investment.userId, user.id))
    .where(eq(investment.dealId, dealId));

  // Transform numeric fields to strings and dates to ISO strings
  return {
    success: true as const,
    investments: investments.map((inv) => ({
      ...inv,
      committedAmount: inv.committedAmount.toString(),
      fundedAmount: inv.fundedAmount?.toString() ?? null,
      currentValue: inv.currentValue?.toString() ?? null,
      distributions: inv.distributions?.toString() ?? null,
      ownershipPercentage: inv.ownershipPercentage?.toString() ?? null,
      committedDate: inv.committedDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt?.toISOString() ?? null,
    })),
  };
}

export type DealInvestmentsData = Awaited<ReturnType<typeof getDealInvestmentsCached>>;


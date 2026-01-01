import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal, dealInterest, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cached function to fetch deal interests.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getDealInterestsCached(dealId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag(`deal-${dealId}-interests`);

  // Verify deal exists
  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRecord) {
    return {
      success: false as const,
      interests: [],
    };
  }

  // Get all interests for this deal with user info
  const interests = await db
    .select({
      id: dealInterest.id,
      userId: dealInterest.userId,
      status: dealInterest.status,
      proposedAmount: dealInterest.proposedAmount,
      createdAt: dealInterest.createdAt,
      updatedAt: dealInterest.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(dealInterest)
    .innerJoin(user, eq(dealInterest.userId, user.id))
    .where(eq(dealInterest.dealId, dealId));

  // Transform numeric fields to strings and dates to ISO strings
  return {
    success: true as const,
    interests: interests.map((interest) => ({
      ...interest,
      proposedAmount: interest.proposedAmount?.toString() ?? null,
      createdAt: interest.createdAt.toISOString(),
      updatedAt: interest.updatedAt?.toISOString() ?? null,
    })),
  };
}

export type DealInterestsData = Awaited<ReturnType<typeof getDealInterestsCached>>;


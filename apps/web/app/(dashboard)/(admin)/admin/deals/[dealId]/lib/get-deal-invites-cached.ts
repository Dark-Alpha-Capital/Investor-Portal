import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal, dealInvite, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cached function to fetch deal invites.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getDealInvitesCached(dealId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag(`deal-${dealId}-invites`);

  // Verify deal exists
  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRecord) {
    return {
      success: false as const,
      invites: [],
    };
  }

  // Get all invites for this deal with user info
  const invites = await db
    .select({
      id: dealInvite.id,
      userId: dealInvite.userId,
      curationNote: dealInvite.curationNote,
      createdAt: dealInvite.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        kycStatus: user.kycStatus,
        isOnboardingCompleted: user.isOnboardingCompleted,
      },
    })
    .from(dealInvite)
    .innerJoin(user, eq(dealInvite.userId, user.id))
    .where(eq(dealInvite.dealId, dealId));

  // Transform dates to ISO strings
  return {
    success: true as const,
    invites: invites.map((invite) => ({
      ...invite,
      createdAt: invite.createdAt.toISOString(),
    })),
  };
}

export type DealInvitesData = Awaited<ReturnType<typeof getDealInvitesCached>>;


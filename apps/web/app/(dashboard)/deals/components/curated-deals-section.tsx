import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, dealInvite } from "@repo/db/schema";
import { desc, eq, and, ne } from "drizzle-orm";
import { DealCard } from "./deal-card";
import { Sparkles } from "lucide-react";

async function fetchCuratedDeals() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  // Fetch invite-only deals that the user has been invited to
  // Join dealInvite to get only deals where user has an invite
  const deals = await db
    .select({
      id: deal.id,
      name: deal.name,
      slug: deal.slug,
      description: deal.description,
      teaserSummary: deal.teaserSummary,
      sector: deal.sector,
      geography: deal.geography,
      dealType: deal.dealType,
      targetRaise: deal.targetRaise,
      minInvestment: deal.minInvestment,
      targetIrr: deal.targetIrr,
      targetMoic: deal.targetMoic,
      status: deal.status,
      visibility: deal.visibility,
      coverImageUrl: deal.coverImageUrl,
      launchDate: deal.launchDate,
      closeDate: deal.closeDate,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      curationNote: dealInvite.curationNote,
    })
    .from(dealInvite)
    .innerJoin(deal, eq(dealInvite.dealId, deal.id))
    .where(
      and(
        eq(dealInvite.userId, session.user.id),
        // eq(deal.visibility, "invite_only"),
        ne(deal.status, "draft") // Exclude draft deals
      )
    )
    .orderBy(desc(deal.createdAt));

  return deals;
}

export async function CuratedDealsSection() {
  const deals = await fetchCuratedDeals();

  if (deals.length === 0) {
    return null; // Don't show section if no curated deals
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Curated for You</h2>
          <p className="text-muted-foreground">
            Deals specifically selected based on your investment profile
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal: any) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

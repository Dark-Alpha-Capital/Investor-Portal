import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, user } from "@repo/db/schema";
import { desc, eq, or, and, ne } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { DealCard } from "./deal-card";

async function fetchPublicDeals() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  // Get user's KYC status
  const [userRecord] = await db
    .select({ kycStatus: user.kycStatus })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const isAccredited = userRecord?.kycStatus === "approved";

  // Build visibility filter
  // Public deals: visible to everyone
  // Accredited deals: only visible if user is accredited
  const visibilityConditions = [eq(deal.visibility, "public")];

  if (isAccredited) {
    visibilityConditions.push(eq(deal.visibility, "accredited"));
  }

  // Fetch deals that are:
  // 1. Not draft (exclude draft deals)
  // 2. Public or (accredited if user is approved)
  // 3. Not invite_only (those are handled separately)
  const deals = await db
    .select()
    .from(deal)
    .where(
      and(
        ne(deal.status, "draft"), // Exclude draft deals
        ne(deal.visibility, "invite_only"), // Exclude invite-only deals
        or(...visibilityConditions) // Public or accredited (if user is accredited)
      )
    )
    .orderBy(desc(deal.createdAt));

  return deals;
}

export async function PublicDealsSection() {
  const deals = await fetchPublicDeals();

  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No deals available at the moment.</p>
            <p className="text-sm mt-2">
              Check back soon for new investment opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Available Deals
        </h2>
        <p className="text-muted-foreground">
          Browse investment opportunities available to you
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal: any) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

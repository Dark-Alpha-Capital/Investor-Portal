import { caller } from "@/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { DealCard } from "./deal-card";

export async function PublicDealsSection() {
  const result = await caller.deals.getPublicDeals();
  const deals = result.deals;

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
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

import { getTrpcCaller } from "@/trpc/server";
import { DealCard } from "./deal-card";
import { Sparkles } from "lucide-react";

export async function CuratedDealsSection() {
  const result = await (await getTrpcCaller()).deals.getCuratedDeals();
  const deals = result.deals;

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
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

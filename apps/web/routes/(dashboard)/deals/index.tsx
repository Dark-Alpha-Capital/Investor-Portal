import { createFileRoute, redirect } from "@tanstack/react-router";
import type { DealsLoaderData } from "@/lib/types/investor-route-loaders";
import { fetchMarketplaceDealsRouteData } from "@/lib/server-fns/investor-route-data";
import { DealsMarketplace } from "./components/deals-marketplace";
import { serializeRouteSearch } from "@/lib/serialize-route-search";

function DealsPageContent({ initialData }: DealsLoaderData) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            Deal Marketplace
          </h1>
          <p className="text-muted-foreground text-base">
            Discover investment opportunities tailored to your profile
          </p>
        </div>

        <DealsMarketplace initialData={initialData} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/(dashboard)/deals/")({
  loader: async ({ location }) => {
    const r = await fetchMarketplaceDealsRouteData({
      data: { search: serializeRouteSearch(location.search) },
    });
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return r.data;
  },
  component: DealsRoutePage,
});

function DealsRoutePage() {
  const { initialData } = Route.useLoaderData();
  return <DealsPageContent initialData={initialData} />;
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedSectorLinks } from "@/components/seo/internal-links";
import { getSectorDataCached } from "../lib/get-sector-cached";

type Params = Promise<{ sector: string }>;

interface SectorContentProps {
  params: Params;
}

/**
 * Server component that handles runtime data (params).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (params) and calls a cached async function.
 */
export async function SectorContent({ params }: SectorContentProps) {
  const { sector: sectorSlug } = await params;
  const data = await getSectorDataCached(sectorSlug);

  if (!data) {
    notFound();
  }

  const { sector, relatedSectors, stats } = data;

  const breadcrumbItems = [
    { name: "Sectors", href: "/sectors" },
    { name: sector.name, href: `/sectors/${sector.slug}` },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {sector.name} Investments
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {sector.description}
        </p>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeDealCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalInvested}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Avg. Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgReturn}</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          About {sector.name} Investing
        </h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{sector.longDescription}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 rounded-lg p-8 mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Ready to Explore {sector.name} Opportunities?
            </h2>
            <p className="text-muted-foreground">
              Join DarkAlpha Capital to access exclusive {sector.name.toLowerCase()} investment deals.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/offerings">View All Offerings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Sectors */}
      {relatedSectors.length > 0 && (
        <section className="mb-12">
          <RelatedSectorLinks currentSector={sector.slug} />
        </section>
      )}

      {/* Investment Types Cross-Link */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Explore by Investment Type</h2>
        <p className="text-muted-foreground mb-4">
          DarkAlpha Capital offers various investment structures for {sector.name.toLowerCase()} opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/investments/private-equity">Private Equity</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/investments/venture-capital">Venture Capital</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/investments/growth-equity">Growth Equity</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

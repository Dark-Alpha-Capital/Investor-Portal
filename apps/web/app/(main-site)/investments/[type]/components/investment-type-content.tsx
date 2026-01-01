import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedInvestmentLinks } from "@/components/seo/internal-links";
import { getInvestmentTypeDataCached } from "../lib/get-investment-type-cached";

type Params = Promise<{ type: string }>;

interface InvestmentTypeContentProps {
  params: Params;
}

const riskLevelColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * Server component that handles runtime data (params).
 * Extracts values and passes them to the cached data fetching function.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (params) and calls a cached async function.
 */
export async function InvestmentTypeContent({
  params,
}: InvestmentTypeContentProps) {
  const { type: typeSlug } = await params;
  const data = await getInvestmentTypeDataCached(typeSlug);

  if (!data) {
    notFound();
  }

  const { investmentType, relatedTypes, stats } = data;

  const breadcrumbItems = [
    { name: "Investments", href: "/investments" },
    { name: investmentType.name, href: `/investments/${investmentType.slug}` },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* Hero Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">
            {investmentType.name}
          </h1>
          {investmentType.riskLevel && (
            <Badge
              className={riskLevelColors[investmentType.riskLevel]}
              variant="secondary"
            >
              {investmentType.riskLevel.charAt(0).toUpperCase() +
                investmentType.riskLevel.slice(1)}{" "}
              Risk
            </Badge>
          )}
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {investmentType.description}
        </p>
      </section>

      {/* Key Info Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Min. Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {investmentType.minInvestment || "Contact Us"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Typical Horizon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {investmentType.typicalHorizon || "Varies"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{stats.activeDealCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold capitalize">
              {investmentType.riskLevel || "Varies"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          About {investmentType.name}
        </h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{investmentType.longDescription}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 rounded-lg p-8 mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Explore {investmentType.name} Opportunities
            </h2>
            <p className="text-muted-foreground">
              Join DarkAlpha Capital to access exclusive{" "}
              {investmentType.name.toLowerCase()} investments.
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

      {/* Related Investment Types */}
      {relatedTypes.length > 0 && (
        <section className="mb-12">
          <RelatedInvestmentLinks currentType={investmentType.slug} />
        </section>
      )}

      {/* Sectors Cross-Link */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Explore by Sector</h2>
        <p className="text-muted-foreground mb-4">
          {investmentType.name} opportunities are available across various
          industry sectors.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sectors/technology">Technology</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sectors/healthcare">Healthcare</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sectors/real-estate">Real Estate</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sectors/financial-services">Financial Services</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchInvestmentTypePagePayload } from "@/lib/server-fns/marketing-route-data";
import { siteConfig } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedInvestmentLinks } from "@/components/seo/internal-links";

const riskLevelColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

type InvestmentLoaderOk = Extract<
  Awaited<ReturnType<typeof fetchInvestmentTypePagePayload>>,
  { tag: "ok" }
>;

export const Route = createFileRoute("/(main-site)/investments/$type/")({
  loader: async ({ params }: { params: { type: string } }) => {
    const r = await fetchInvestmentTypePagePayload({
      data: { typeSlug: params.type },
    });
    if (r.tag === "not_found") {
      throw notFound();
    }
    return r;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const d = loaderData as InvestmentLoaderOk;
    const name = d.investmentType.name;
    const description = d.investmentType.description;
    return {
      meta: [
        {
          title: `${name} Investments | ${siteConfig.name}`,
        },
        {
          name: "description",
          content: description,
        },
        {
          name: "keywords",
          content: d.investmentType.keywords.join(", "),
        },
        {
          property: "og:title",
          content: `${name} Investments`,
        },
        {
          property: "og:description",
          content: description,
        },
      ],
    };
  },
  component: InvestmentTypeRoutePage,
});

function InvestmentTypeRoutePage() {
  const data = Route.useLoaderData();
  return (
    <>
      <JsonLd data={data.jsonLd} />
      <InvestmentTypeInner data={data} />
    </>
  );
}

function InvestmentTypeInner({ data }: { data: InvestmentLoaderOk }) {
  const { investmentType, relatedTypes, breadcrumbItems } = data;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <section className="mb-12">
        <div className="mb-4 flex items-center gap-3">
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
        <p className="max-w-3xl text-xl text-muted-foreground">
          {investmentType.description}
        </p>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            Min. Investment
          </p>
          <p className="text-xl font-bold">
            {investmentType.minInvestment || "Contact Us"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Typical Horizon
          </p>
          <p className="text-xl font-bold">
            {investmentType.typicalHorizon || "Varies"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4" />
            Active Deals
          </p>
          <p className="text-xl font-bold">0</p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center text-sm font-medium text-muted-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Risk Profile
          </p>
          <p className="text-xl font-bold capitalize">
            {investmentType.riskLevel || "Varies"}
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">About {investmentType.name}</h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{investmentType.longDescription}</p>
        </div>
      </section>

      <section className="mb-12 rounded-lg bg-muted/50 p-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="mb-2 text-2xl font-bold">
              Explore {investmentType.name} Opportunities
            </h2>
            <p className="text-muted-foreground">
              Join DarkAlpha Capital to access exclusive{" "}
              {investmentType.name.toLowerCase()} investments.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link to="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/offerings">View All Offerings</Link>
            </Button>
          </div>
        </div>
      </section>

      {relatedTypes.length > 0 && (
        <section className="mb-12">
          <RelatedInvestmentLinks currentType={investmentType.slug} />
        </section>
      )}

      <section className="border-t pt-8">
        <h2 className="mb-4 text-xl font-bold">Explore by Sector</h2>
        <p className="mb-4 text-muted-foreground">
          {investmentType.name} opportunities are available across various
          industry sectors.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sectors/technology">Technology</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sectors/healthcare">Healthcare</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sectors/real-estate">Real Estate</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sectors/financial-services">Financial Services</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

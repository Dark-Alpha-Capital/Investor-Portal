import { createServerFn } from "@tanstack/react-start";
import {
  getSectorBySlug,
  getRelatedSectors,
} from "@/lib/constants/sectors";
import {
  getInvestmentTypeBySlug,
  getRelatedInvestmentTypes,
} from "@/lib/constants/investment-types";
import {
  generateFinancialServiceJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";

export const fetchSectorPagePayload = createServerFn({ method: "GET" })
  .inputValidator((input: { sectorSlug: string }) => input)
  .handler(({ data }) => {
    const sector = getSectorBySlug(data.sectorSlug);
    if (!sector) {
      return { tag: "not_found" as const };
    }

    const relatedSectors = getRelatedSectors(data.sectorSlug);
    const breadcrumbItems = [
      { name: "Sectors", href: "/sectors" },
      { name: sector.name, href: `/sectors/${sector.slug}` },
    ];

    const financialServiceJsonLd = generateFinancialServiceJsonLd(
      `${sector.name} Investments`,
      sector.description,
      `/sectors/${sector.slug}`,
      `${sector.name} Investment Services`,
    );

    const webPageJsonLd = generateWebPageJsonLd(
      `${sector.name} Investments`,
      sector.description,
      `/sectors/${sector.slug}`,
      [
        { name: "Sectors", href: "/sectors" },
        { name: sector.name, href: `/sectors/${sector.slug}` },
      ],
    );

    return {
      tag: "ok" as const,
      sector,
      relatedSectors,
      breadcrumbItems,
      jsonLd: [financialServiceJsonLd, webPageJsonLd],
    };
  });

export const fetchInvestmentTypePagePayload = createServerFn({
  method: "GET",
})
  .inputValidator((input: { typeSlug: string }) => input)
  .handler(({ data }) => {
    const investmentType = getInvestmentTypeBySlug(data.typeSlug);
    if (!investmentType) {
      return { tag: "not_found" as const };
    }

    const relatedTypes = getRelatedInvestmentTypes(data.typeSlug);
    const breadcrumbItems = [
      { name: "Investments", href: "/investments" },
      {
        name: investmentType.name,
        href: `/investments/${investmentType.slug}`,
      },
    ];

    const financialServiceJsonLd = generateFinancialServiceJsonLd(
      investmentType.name,
      investmentType.description,
      `/investments/${investmentType.slug}`,
      investmentType.name,
    );

    const webPageJsonLd = generateWebPageJsonLd(
      `${investmentType.name} Investments`,
      investmentType.description,
      `/investments/${investmentType.slug}`,
      [
        { name: "Investments", href: "/investments" },
        {
          name: investmentType.name,
          href: `/investments/${investmentType.slug}`,
        },
      ],
    );

    return {
      tag: "ok" as const,
      investmentType,
      relatedTypes,
      breadcrumbItems,
      jsonLd: [financialServiceJsonLd, webPageJsonLd],
    };
  });

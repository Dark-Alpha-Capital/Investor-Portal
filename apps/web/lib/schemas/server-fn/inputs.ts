import { z } from "zod";

const marketingSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Serialized `location.search` (e.g. `?page=1&foo=bar`). */
export const routeSearchStringSchema = z.object({
  search: z.string().max(8192),
});

export type RouteSearchStringInput = z.infer<typeof routeSearchStringSchema>;

/** Primary-key style ids from the database (text). */
export const dealIdInputSchema = z.object({
  dealId: z.string().trim().min(1).max(128),
});

export type DealIdInput = z.infer<typeof dealIdInputSchema>;

export const investorIdInputSchema = z.object({
  investorId: z.string().trim().min(1).max(128),
});

export type InvestorIdInput = z.infer<typeof investorIdInputSchema>;

export const sectorPageInputSchema = z.object({
  sectorSlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(marketingSlugRegex, "Invalid sector slug"),
});

export type SectorPageInput = z.infer<typeof sectorPageInputSchema>;

export const investmentTypePageInputSchema = z.object({
  typeSlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(marketingSlugRegex, "Invalid type slug"),
});

export type InvestmentTypePageInput = z.infer<
  typeof investmentTypePageInputSchema
>;

/** Prismic document UID — permissive to avoid breaking CMS-defined UIDs. */
export const prismicUidInputSchema = z.object({
  uid: z.string().trim().min(1).max(200),
});

export type PrismicUidInput = z.infer<typeof prismicUidInputSchema>;

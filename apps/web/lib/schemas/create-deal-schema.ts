import { z } from "zod";

export const dealStatusEnum = z.enum([
  "draft",
  "coming_soon",
  "live",
  "closing",
  "funded",
  "exited",
  "cancelled",
]);

export const dealVisibilityEnum = z.enum([
  "public",
  "accredited",
  "invite_only",
]);

export const createDealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  description: z.string().min(1, "Description is required"),
  teaserSummary: z.string().min(1, "Teaser summary is required"),
  sector: z.string().min(1, "Sector is required"),
  geography: z.string().min(1, "Geography is required"),
  dealType: z.string().min(1, "Deal type is required"),
  targetRaise: z.string().min(1, "Target raise is required"),
  minInvestment: z.string().min(1, "Minimum investment is required"),
  targetIrr: z.string().min(1, "Target IRR is required"),
  targetMoic: z.string().min(1, "Target MOIC is required"),
  status: dealStatusEnum,
  visibility: dealVisibilityEnum,
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  launchDate: z.string().min(1, "Launch date is required"),
  closeDate: z.string().min(1, "Close date is required"),
});

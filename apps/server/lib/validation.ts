import { z } from "zod";

// File schema for validation
const FileSchema = z.object({
  documentType: z.string(),
  name: z.string().min(1),
  type: z.string(),
  size: z.number().positive(),
  buffer: z.string(), // base64 encoded
});

// Investor data schema
const InvestorDataSchema = z.object({
  // Section 1: Investor / Lender Details
  organizationName: z.string().min(1),
  primaryContactName: z.string().min(1),
  primaryContactTitle: z.string().nullable().optional(),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string().min(1),
  capitalProviderType: z.string().min(1),
  investorType: z.string().min(1),
  geographicFocus: z.string().nullable().optional(),

  // Section 2: Independent Sponsor Fit
  openToEmergingSponsor: z.string().min(1),
  minimumRequirements: z.string().nullable().optional(),
  priorDealAttribution: z.string().min(1),
  priorDealAttributionExplanation: z.string().nullable().optional(),

  // Section 3: NDAs & Confidentiality
  ndaPreference: z.string().min(1),
  ndaLimitations: z.string().nullable().optional(),

  // Section 4: Process & Timing
  timingToLOI: z.string().min(1),
  timingToCommitment: z.string().min(1),
  timingDrivers: z.string().nullable().optional(),

  // Section 5: Economics
  economicsDescription: z.string().min(1),

  // Section 6: Governance & Control
  preferredRole: z.string().min(1),
  governanceExpectations: z.string().nullable().optional(),

  // Section 7: Support Letters
  provideSupportLetter: z.string().min(1),
  joinBrokerConversations: z.string().min(1),
  supportLetterStages: z.array(z.string()),

  // Section 8: Communication Preferences
  receiveUpdates: z.string().min(1),
  updateFrequency: z.string().nullable().optional(),
  updateFormat: z.array(z.string()).nullable().optional(),
  industryPreferences: z.string().nullable().optional(),

  // Section 9: Investment Mandate - Size & Structure
  equityCheckSize: z.string().min(1),
  enterpriseValueRange: z.string().nullable().optional(),
  ebitdaRange: z.string().nullable().optional(),
  preferredOwnership: z.string().min(1),
  typicalHoldPeriod: z.string().nullable().optional(),
  transactionTypes: z.array(z.string()),
  leverageTolerance: z.string().nullable().optional(),

  // Section 10: Investment Mandate - Company Profile
  revenueCharacteristics: z.string().min(1),
  customerConcentration: z.string().nullable().optional(),
  marginsAndCashFlow: z.string().nullable().optional(),
  assetProfile: z.string().min(1),
  managementInvolvement: z.string().nullable().optional(),

  // Section 11: Sectors & Themes
  sectorsOfInterest: z.string().min(1),
  sectorsToAvoid: z.string().nullable().optional(),
  dealSizeThresholds: z.string().nullable().optional(),
  specificThemes: z.string().nullable().optional(),
});

// Main request schema
export const OnboardingSubmitSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  investorData: InvestorDataSchema,
  files: z.array(FileSchema).optional().default([]),
});

export type OnboardingSubmitRequest = z.infer<typeof OnboardingSubmitSchema>;

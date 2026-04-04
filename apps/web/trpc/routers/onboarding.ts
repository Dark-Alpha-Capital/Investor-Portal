import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../init";
import {
  onboarding,
  onboardingDocument,
  onboardingEditHistory,
  sideEffectOutbox,
  user,
  beneficialOwner,
  authorizedSignatory,
  kycAttestation,
} from "@repo/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { TRPCError } from "@trpc/server";
import { mapWorkflowStatusToJobProgress } from "@/lib/map-workflow-job-status";
import { revalidateTag } from "next/cache";
import { dispatchPendingOutbox } from "@/lib/outbox";
import {
  EMAIL_CONFIG,
  type OnboardingInvestorConfirmationJobData,
  type OnboardingAdminNotificationJobData,
} from "@repo/mail/types";
import { sanitizeUploadFileName } from "@repo/nextcloud";

// Admin email for onboarding notifications - can be configured via env var
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_CONFIG.defaultAdminEmail;

// Zod schema for beneficial owner
const beneficialOwnerSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  ownershipPercentage: z.number().min(0).max(100),
  controlType: z.string().optional().or(z.literal("")),
  isPep: z.boolean().default(false),
  pepDetails: z.string().optional().or(z.literal("")),
  // Address
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  stateProvince: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  countryOfResidence: z.string().optional().or(z.literal("")),
  // ID document
  idDocumentType: z.string().optional().or(z.literal("")),
  idDocumentNumber: z.string().optional().or(z.literal("")),
  idExpiryDate: z.string().optional().or(z.literal("")),
});

// Zod schema for authorized signatory
const authorizedSignatorySchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  authorizationScope: z.string().optional().or(z.literal("")),
  authorizationLimit: z.number().optional(),
  idDocumentType: z.string().optional().or(z.literal("")),
  idDocumentNumber: z.string().optional().or(z.literal("")),
  boardResolutionDate: z.string().optional().or(z.literal("")),
});

// Zod schema matching InvestorData type
const investorDataSchema = z.object({
  // KYC1: Legal Entity Type (driver field for conditional compliance logic)
  legalEntityType: z.enum(["individual", "entity"]).optional(),

  // Section 1: Investor / Lender Details
  organizationName: z.string().min(1, "Organization name is required"),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  primaryContactTitle: z.string().optional().or(z.literal("")),
  primaryContactEmail: z.string().email("Invalid email address"),
  primaryContactPhone: z.string().min(1, "Phone is required"),
  capitalProviderType: z.string().min(1, "Capital provider type is required"),
  investorType: z.string().min(1, "Investor type is required"),
  geographicFocus: z.string().optional().or(z.literal("")),

  // Step 2: Accreditation & Status
  accreditationStatus: z.string().optional(),
  accreditationMethod: z.string().optional(),
  entityTaxId: z.string().optional(),
  entitySignatoryName: z.string().optional(),
  entitySignatoryTitle: z.string().optional(),

  // Individual-specific compliance fields (KYC2)
  pepStatus: z.boolean().optional(),
  pepDetails: z.string().optional().or(z.literal("")),
  sourceOfWealthNarrative: z.string().optional().or(z.literal("")),

  // Entity-specific compliance fields (KYC3-5)
  beneficialOwners: z.array(beneficialOwnerSchema).optional(),
  authorizedSignatories: z.array(authorizedSignatorySchema).optional(),

  // Mandatory attestations (KYC7)
  accuracyAttestation: z.boolean().optional(),
  sanctionsDeclaration: z.boolean().optional(),
  dataConsent: z.boolean().optional(),

  // Section 2: Independent Sponsor Fit
  openToEmergingSponsor: z
    .string()
    .min(1, "Please select an option for emerging sponsors"),
  minimumRequirements: z.string().optional().or(z.literal("")),
  priorDealAttribution: z
    .string()
    .min(1, "Please select an option for prior deal attribution"),
  priorDealAttributionExplanation: z.string().optional().or(z.literal("")),

  // Section 3: NDAs & Confidentiality
  ndaPreference: z.string().min(1, "Please select an NDA preference"),
  ndaLimitations: z.string().optional().or(z.literal("")),

  // Section 4: Process & Timing
  timingToLOI: z.string().min(1, "Please select timing to LOI"),
  timingToCommitment: z.string().min(1, "Please select timing to commitment"),
  timingDrivers: z.string().optional().or(z.literal("")),

  // Section 5: Economics
  economicsDescription: z.string().min(1, "Please describe economics"),

  // Section 6: Governance & Control
  preferredRole: z.string().min(1, "Please select preferred role"),
  governanceExpectations: z.string().optional().or(z.literal("")),

  // Section 7: Support Letters
  provideSupportLetter: z
    .string()
    .min(1, "Please select an option for support letters"),
  joinBrokerConversations: z
    .string()
    .min(1, "Please select an option for broker conversations"),
  supportLetterStages: z
    .array(z.string())
    .min(1, "Please select at least one stage"),

  // Section 8: Communication Preferences
  receiveUpdates: z
    .string()
    .min(1, "Please select if you want to receive updates"),
  updateFrequency: z.string().optional(),
  updateFormat: z.array(z.string()).optional(),
  industryPreferences: z.string().optional().or(z.literal("")),

  // Section 9: Investment Mandate - Size & Structure
  equityCheckSize: z.string().min(1, "Please provide equity check size"),
  enterpriseValueRange: z.string().optional().or(z.literal("")),
  ebitdaRange: z.string().optional().or(z.literal("")),
  preferredOwnership: z.string().min(1, "Please select preferred ownership"),
  typicalHoldPeriod: z.string().optional().or(z.literal("")),
  transactionTypes: z
    .array(z.string())
    .min(1, "Please select at least one transaction type"),
  leverageTolerance: z.string().optional().or(z.literal("")),

  // Section 10: Investment Mandate - Company Profile
  revenueCharacteristics: z
    .string()
    .min(1, "Please describe revenue characteristics"),
  customerConcentration: z.string().optional().or(z.literal("")),
  marginsAndCashFlow: z.string().optional().or(z.literal("")),
  assetProfile: z.string().min(1, "Please select asset profile"),
  managementInvolvement: z.string().optional().or(z.literal("")),

  // Section 11: Sectors & Themes
  sectorsOfInterest: z.string().min(1, "Please list sectors of interest"),
  sectorsToAvoid: z.string().optional().or(z.literal("")),
  dealSizeThresholds: z.string().optional().or(z.literal("")),
  specificThemes: z.string().optional().or(z.literal("")),

  // Step 5: Legal & E-Sign
  legalDocumentsAcknowledged: z.boolean().optional(),
  electronicSignatureName: z.string().optional(),
  electronicSignatureDate: z.string().optional(),
});

/** File uploads for onboarding submit (tRPC + HTTP proxy). */
export const onboardingSubmitFileSchema = z.object({
  documentType: z.string().min(1).max(128),
  name: z.string().min(1).max(512),
  type: z.string().max(256),
  size: z.number().int().positive().max(25 * 1024 * 1024),
  buffer: z.string().min(1).max(40_000_000),
});

/** Main onboarding submit body (shared with `/api/onboarding/submit`). */
export const onboardingSubmitSchema = z.object({
  investorData: investorDataSchema,
  files: z.array(onboardingSubmitFileSchema).max(50),
});

// Helper functions hoisted outside mutation for better performance
const toNullIfEmpty = (value: string | undefined | null): string | null => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  return value;
};

const trimRequired = (value: string | undefined | null): string => {
  if (!value || typeof value !== "string") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Required field is missing or invalid: ${value}`,
    });
  }
  return value.trim();
};

export const onboardingRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(onboardingSubmitSchema)
    .mutation(async ({ input, ctx }) => {
      const { investorData, files } = input;
      const userId = ctx.session.user.id;

      // Early validation: files are required
      if (!files || files.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "KYC files are required for onboarding submission",
        });
      }

      // Verify user exists and generate onboarding ID in parallel
      const [userRecord] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Generate onboarding ID
      const onboardingId = randomUUID();
      const submittedAt = new Date();

      // Prepare onboarding data for database
      const onboardingData = {
        id: onboardingId,
        userId: userId,

        // KYC1: Legal Entity Type
        legalEntityType: investorData.legalEntityType ?? null,

        // Individual-specific compliance fields (KYC2)
        pepStatus: investorData.pepStatus ?? false,
        pepDetails: toNullIfEmpty(investorData.pepDetails),
        sourceOfWealthNarrative: toNullIfEmpty(
          investorData.sourceOfWealthNarrative
        ),

        // Mandatory attestations (KYC7) - stored on onboarding for quick access
        accuracyAttestation: investorData.accuracyAttestation ?? false,
        sanctionsDeclaration: investorData.sanctionsDeclaration ?? false,
        dataConsent: investorData.dataConsent ?? false,

        // Section 1: Investor / Lender Details
        organizationName: trimRequired(investorData.organizationName),
        primaryContactName: trimRequired(investorData.primaryContactName),
        primaryContactTitle: toNullIfEmpty(investorData.primaryContactTitle),
        primaryContactEmail: trimRequired(investorData.primaryContactEmail),
        primaryContactPhone: trimRequired(investorData.primaryContactPhone),
        capitalProviderType: trimRequired(investorData.capitalProviderType),
        investorType: trimRequired(investorData.investorType),
        geographicFocus: toNullIfEmpty(investorData.geographicFocus),

        // Step 2: Accreditation & Status
        accreditationStatus: toNullIfEmpty(investorData.accreditationStatus),
        accreditationMethod: toNullIfEmpty(investorData.accreditationMethod),
        entityTaxId: toNullIfEmpty(investorData.entityTaxId),
        entitySignatoryName: toNullIfEmpty(investorData.entitySignatoryName),
        entitySignatoryTitle: toNullIfEmpty(investorData.entitySignatoryTitle),

        // Section 2: Independent Sponsor Fit
        openToEmergingSponsor: trimRequired(investorData.openToEmergingSponsor),
        minimumRequirements: toNullIfEmpty(investorData.minimumRequirements),
        priorDealAttribution: trimRequired(investorData.priorDealAttribution),
        priorDealAttributionExplanation: toNullIfEmpty(
          investorData.priorDealAttributionExplanation
        ),

        // Section 3: NDAs & Confidentiality
        ndaPreference: trimRequired(investorData.ndaPreference),
        ndaLimitations: toNullIfEmpty(investorData.ndaLimitations),

        // Section 4: Process & Timing
        timingToLOI: trimRequired(investorData.timingToLOI),
        timingToCommitment: trimRequired(investorData.timingToCommitment),
        timingDrivers: toNullIfEmpty(investorData.timingDrivers),

        // Section 5: Economics
        economicsDescription: trimRequired(investorData.economicsDescription),

        // Section 6: Governance & Control
        preferredRole: trimRequired(investorData.preferredRole),
        governanceExpectations: toNullIfEmpty(
          investorData.governanceExpectations
        ),

        // Section 7: Support Letters
        provideSupportLetter: trimRequired(investorData.provideSupportLetter),
        joinBrokerConversations: trimRequired(
          investorData.joinBrokerConversations
        ),
        supportLetterStages: investorData.supportLetterStages ?? [],

        // Section 8: Communication Preferences
        receiveUpdates: trimRequired(investorData.receiveUpdates),
        updateFrequency: toNullIfEmpty(investorData.updateFrequency),
        updateFormat: investorData.updateFormat ?? null,
        industryPreferences: toNullIfEmpty(investorData.industryPreferences),

        // Section 9: Investment Mandate - Size & Structure
        equityCheckSize: trimRequired(investorData.equityCheckSize),
        enterpriseValueRange: toNullIfEmpty(investorData.enterpriseValueRange),
        ebitdaRange: toNullIfEmpty(investorData.ebitdaRange),
        preferredOwnership: trimRequired(investorData.preferredOwnership),
        typicalHoldPeriod: toNullIfEmpty(investorData.typicalHoldPeriod),
        transactionTypes: investorData.transactionTypes ?? [],
        leverageTolerance: toNullIfEmpty(investorData.leverageTolerance),

        // Section 10: Investment Mandate - Company Profile
        revenueCharacteristics: trimRequired(
          investorData.revenueCharacteristics
        ),
        customerConcentration: toNullIfEmpty(
          investorData.customerConcentration
        ),
        marginsAndCashFlow: toNullIfEmpty(investorData.marginsAndCashFlow),
        assetProfile: trimRequired(investorData.assetProfile),
        managementInvolvement: toNullIfEmpty(
          investorData.managementInvolvement
        ),

        // Section 11: Sectors & Themes
        sectorsOfInterest: trimRequired(investorData.sectorsOfInterest),
        sectorsToAvoid: toNullIfEmpty(investorData.sectorsToAvoid),
        dealSizeThresholds: toNullIfEmpty(investorData.dealSizeThresholds),
        specificThemes: toNullIfEmpty(investorData.specificThemes),

        // Step 5: Legal & E-Sign
        legalDocumentsAcknowledged:
          investorData.legalDocumentsAcknowledged ?? false,
        electronicSignatureName: toNullIfEmpty(
          investorData.electronicSignatureName
        ),
        electronicSignatureDate: toNullIfEmpty(
          investorData.electronicSignatureDate
        ),

        // Status
        status: "submitted" as const,
        submittedAt,
      };

      // Prepare parallel database operations for entity-specific data
      const isEntity = investorData.legalEntityType === "entity";
      const hasBeneficialOwners =
        isEntity &&
        investorData.beneficialOwners &&
        investorData.beneficialOwners.length > 0;
      const hasAuthorizedSignatories =
        isEntity &&
        investorData.authorizedSignatories &&
        investorData.authorizedSignatories.length > 0;
      const hasKycAttestations =
        investorData.accuracyAttestation ||
        investorData.sanctionsDeclaration ||
        investorData.dataConsent;

      // Prepare data for parallel inserts
      const uboRecords = hasBeneficialOwners
        ? investorData.beneficialOwners!.map((ubo) => ({
          id: randomUUID(),
          onboardingId: onboardingId,
          fullName: ubo.fullName,
          dateOfBirth: ubo.dateOfBirth || null,
          nationality: ubo.nationality || null,
          countryOfResidence: ubo.countryOfResidence || null,
          ownershipPercentage: ubo.ownershipPercentage,
          controlType: ubo.controlType || null,
          addressLine1: ubo.addressLine1 || null,
          addressLine2: ubo.addressLine2 || null,
          city: ubo.city || null,
          stateProvince: ubo.stateProvince || null,
          postalCode: ubo.postalCode || null,
          country: ubo.country || null,
          idDocumentType: ubo.idDocumentType || null,
          idDocumentNumber: ubo.idDocumentNumber || null,
          idExpiryDate: ubo.idExpiryDate || null,
          isPep: ubo.isPep || false,
          pepDetails: ubo.pepDetails || null,
        }))
        : null;

      const signatoryRecords = hasAuthorizedSignatories
        ? investorData.authorizedSignatories!.map((sig) => ({
          id: randomUUID(),
          onboardingId: onboardingId,
          fullName: sig.fullName,
          title: sig.title || null,
          email: sig.email || null,
          phone: sig.phone || null,
          authorizationScope: sig.authorizationScope || null,
          authorizationLimit: sig.authorizationLimit || null,
          idDocumentType: sig.idDocumentType || null,
          idDocumentNumber: sig.idDocumentNumber || null,
          boardResolutionDate: sig.boardResolutionDate || null,
        }))
        : null;

      const kycAttestationRecord = hasKycAttestations
        ? {
          id: randomUUID(),
          onboardingId: onboardingId,
          accuracyAttested: investorData.accuracyAttestation || false,
          accuracyAttestedAt: investorData.accuracyAttestation
            ? submittedAt
            : null,
          sanctionsDeclarationAttested:
            investorData.sanctionsDeclaration || false,
          sanctionsDeclarationAttestedAt: investorData.sanctionsDeclaration
            ? submittedAt
            : null,
          dataConsentAttested: investorData.dataConsent || false,
          dataConsentAttestedAt: investorData.dataConsent
            ? submittedAt
            : null,
          ipAddress: null,
          userAgent: null,
        }
        : null;

      // Prepare file upload job data and document records
      const fileJobData = {
        onboardingId,
        investorId: userId,
        files: files.map((file) => ({
          documentType: file.documentType,
          fileName: file.name,
          fileBuffer: file.buffer, // Already base64 encoded
          mimeType: file.type,
          size: file.size,
        })),
      };

      // Create document records in the database
      // These records will be updated by the worker with the final file paths
      const documentRecords = files.map((file) => {
        const sanitizedFileName = sanitizeUploadFileName(file.name);
        const expectedFilePath = `/investors/${userId}/onboarding/kyc-files/${sanitizedFileName}`;

        return {
          id: randomUUID(),
          onboardingId,
          documentType: file.documentType,
          fileName: file.name,
          fileSize: String(file.size),
          fileType: file.type,
          filePath: expectedFilePath, // Will be the path in Nextcloud
          fileUrl: null, // Can be set later if needed for direct access
          status: "pending" as const,
        };
      });

      // Prepare email job data
      const investorEmailData: OnboardingInvestorConfirmationJobData = {
        type: "onboarding-investor-confirmation",
        to: investorData.primaryContactEmail,
        primaryContactName: investorData.primaryContactName,
        organizationName: investorData.organizationName,
      };

      const adminEmailData: OnboardingAdminNotificationJobData = {
        type: "onboarding-admin-notification",
        to: ADMIN_NOTIFICATION_EMAIL,
        organizationName: investorData.organizationName,
        primaryContactName: investorData.primaryContactName,
        primaryContactEmail: investorData.primaryContactEmail,
        primaryContactPhone: investorData.primaryContactPhone,
        investorType: investorData.investorType,
        capitalProviderType: investorData.capitalProviderType,
        onboardingId,
        fileCount: files.length,
        submittedAt: submittedAt.toISOString(),
      };

      try {
        // Keep all database writes atomic to avoid partial onboarding state.
        await ctx.db.transaction(async (tx) => {
          await tx.insert(onboarding).values(onboardingData);

          await tx
            .update(user)
            .set({
              isOnboardingCompleted: true,
            })
            .where(eq(user.id, userId));

          if (uboRecords) {
            await tx.insert(beneficialOwner).values(uboRecords);
          }

          if (signatoryRecords) {
            await tx.insert(authorizedSignatory).values(signatoryRecords);
          }

          if (kycAttestationRecord) {
            await tx.insert(kycAttestation).values(kycAttestationRecord);
          }

          await tx.insert(onboardingDocument).values(documentRecords);

          await tx.insert(sideEffectOutbox).values([
            {
              id: randomUUID(),
              topic: "queue",
              dedupeKey: `onboarding:upload-files:${onboardingId}`,
              payload: {
                queue: "onboarding",
                jobName: "upload-onboarding-files",
                jobId: `upload-onboarding-files:${onboardingId}`,
                data: fileJobData,
              },
            },
            {
              id: randomUUID(),
              topic: "queue",
              dedupeKey: `onboarding:email-investor:${onboardingId}`,
              payload: {
                queue: "email",
                jobName: "onboarding-investor-confirmation",
                jobId: `onboarding-investor-confirmation:${onboardingId}`,
                data: investorEmailData,
              },
            },
            {
              id: randomUUID(),
              topic: "queue",
              dedupeKey: `onboarding:email-admin:${onboardingId}`,
              payload: {
                queue: "email",
                jobName: "onboarding-admin-notification",
                jobId: `onboarding-admin-notification:${onboardingId}`,
                data: adminEmailData,
              },
            },
          ]);
        });

        await dispatchPendingOutbox(ctx.db);

        revalidateTag(`onboarding-status-${userId}`, "max");

        return {
          success: true,
          message: "Onboarding data submitted successfully",
          onboardingId,
          jobId: `upload-onboarding-files:${onboardingId}`,
          timestamp: submittedAt.toISOString(),
          userId,
          fileCount: files.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to queue file uploads or send notifications",
          cause: error,
        });
      }
    }),

  // Get job progress
  getJobProgress: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const prefix = "upload-onboarding-files:";
      if (!input.jobId.startsWith(prefix)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }
      const onboardingId = input.jobId.slice(prefix.length);

      const [record] = await ctx.db
        .select({ userId: onboarding.userId })
        .from(onboarding)
        .where(eq(onboarding.id, onboardingId))
        .limit(1);

      if (!record || record.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to access this job",
        });
      }

      let instance;
      try {
        instance = await env.ONBOARDING_KYC_WORKFLOW.get(input.jobId);
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const details = await instance.status();
      return mapWorkflowStatusToJobProgress(input.jobId, details);
    }),



  // Update onboarding data (investor can edit after submission)
  updateOnboarding: protectedProcedure
    .input(
      z.object({
        // All editable fields (partial - only send what changed)
        organizationName: z.string().optional(),
        primaryContactName: z.string().optional(),
        primaryContactTitle: z.string().optional(),
        primaryContactEmail: z.string().email().optional(),
        primaryContactPhone: z.string().optional(),
        capitalProviderType: z.string().optional(),
        investorType: z.string().optional(),
        geographicFocus: z.string().optional(),
        accreditationStatus: z.string().optional(),
        accreditationMethod: z.string().optional(),
        entityTaxId: z.string().optional(),
        entitySignatoryName: z.string().optional(),
        entitySignatoryTitle: z.string().optional(),
        openToEmergingSponsor: z.string().optional(),
        minimumRequirements: z.string().optional(),
        priorDealAttribution: z.string().optional(),
        priorDealAttributionExplanation: z.string().optional(),
        ndaPreference: z.string().optional(),
        ndaLimitations: z.string().optional(),
        timingToLOI: z.string().optional(),
        timingToCommitment: z.string().optional(),
        timingDrivers: z.string().optional(),
        economicsDescription: z.string().optional(),
        preferredRole: z.string().optional(),
        governanceExpectations: z.string().optional(),
        provideSupportLetter: z.string().optional(),
        joinBrokerConversations: z.string().optional(),
        supportLetterStages: z.array(z.string()).optional(),
        receiveUpdates: z.string().optional(),
        updateFrequency: z.string().optional(),
        updateFormat: z.array(z.string()).optional(),
        industryPreferences: z.string().optional(),
        equityCheckSize: z.string().optional(),
        enterpriseValueRange: z.string().optional(),
        ebitdaRange: z.string().optional(),
        preferredOwnership: z.string().optional(),
        typicalHoldPeriod: z.string().optional(),
        transactionTypes: z.array(z.string()).optional(),
        leverageTolerance: z.string().optional(),
        revenueCharacteristics: z.string().optional(),
        customerConcentration: z.string().optional(),
        marginsAndCashFlow: z.string().optional(),
        assetProfile: z.string().optional(),
        managementInvolvement: z.string().optional(),
        sectorsOfInterest: z.string().optional(),
        sectorsToAvoid: z.string().optional(),
        dealSizeThresholds: z.string().optional(),
        specificThemes: z.string().optional(),
        // Compliance fields
        legalEntityType: z.enum(["individual", "entity"]).optional(),
        pepStatus: z.boolean().optional(),
        pepDetails: z.string().optional(),
        sourceOfWealthNarrative: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get current onboarding
      const [currentOnboarding] = await ctx.db
        .select()
        .from(onboarding)
        .where(eq(onboarding.userId, userId))
        .orderBy(desc(onboarding.createdAt))
        .limit(1);

      if (!currentOnboarding) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No onboarding found to edit",
        });
      }

      // Check if editing is allowed
      if (currentOnboarding.isEditable === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This onboarding can no longer be edited",
        });
      }

      // Field label mapping for human-readable edit history
      const fieldLabels: Record<string, string> = {
        organizationName: "Organization Name",
        primaryContactName: "Primary Contact Name",
        primaryContactTitle: "Primary Contact Title",
        primaryContactEmail: "Primary Contact Email",
        primaryContactPhone: "Primary Contact Phone",
        capitalProviderType: "Capital Provider Type",
        investorType: "Investor Type",
        geographicFocus: "Geographic Focus",
        accreditationStatus: "Accreditation Status",
        accreditationMethod: "Accreditation Method",
        entityTaxId: "Entity Tax ID",
        entitySignatoryName: "Entity Signatory Name",
        entitySignatoryTitle: "Entity Signatory Title",
        openToEmergingSponsor: "Open to Emerging Sponsor",
        minimumRequirements: "Minimum Requirements",
        priorDealAttribution: "Prior Deal Attribution",
        priorDealAttributionExplanation: "Prior Deal Attribution Explanation",
        ndaPreference: "NDA Preference",
        ndaLimitations: "NDA Limitations",
        timingToLOI: "Timing to LOI",
        timingToCommitment: "Timing to Commitment",
        timingDrivers: "Timing Drivers",
        economicsDescription: "Economics Description",
        preferredRole: "Preferred Role",
        governanceExpectations: "Governance Expectations",
        provideSupportLetter: "Provide Support Letter",
        joinBrokerConversations: "Join Broker Conversations",
        supportLetterStages: "Support Letter Stages",
        receiveUpdates: "Receive Updates",
        updateFrequency: "Update Frequency",
        updateFormat: "Update Format",
        industryPreferences: "Industry Preferences",
        equityCheckSize: "Equity Check Size",
        enterpriseValueRange: "Enterprise Value Range",
        ebitdaRange: "EBITDA Range",
        preferredOwnership: "Preferred Ownership",
        typicalHoldPeriod: "Typical Hold Period",
        transactionTypes: "Transaction Types",
        leverageTolerance: "Leverage Tolerance",
        revenueCharacteristics: "Revenue Characteristics",
        customerConcentration: "Customer Concentration",
        marginsAndCashFlow: "Margins and Cash Flow",
        assetProfile: "Asset Profile",
        managementInvolvement: "Management Involvement",
        sectorsOfInterest: "Sectors of Interest",
        sectorsToAvoid: "Sectors to Avoid",
        dealSizeThresholds: "Deal Size Thresholds",
        specificThemes: "Specific Themes",
        legalEntityType: "Legal Entity Type",
        pepStatus: "PEP Status",
        pepDetails: "PEP Details",
        sourceOfWealthNarrative: "Source of Wealth Narrative",
      };

      // Track changes
      const changes: {
        fieldName: string;
        fieldLabel: string;
        previousValue: string | null;
        newValue: string | null;
      }[] = [];

      // Build update object and track changes
      const updateData: Record<string, unknown> = {};

      for (const [key, newValue] of Object.entries(input)) {
        if (newValue === undefined) continue;

        const currentValue =
          currentOnboarding[key as keyof typeof currentOnboarding];

        // Stringify values for comparison
        const currentStr =
          currentValue === null || currentValue === undefined
            ? null
            : typeof currentValue === "object"
              ? JSON.stringify(currentValue)
              : String(currentValue);
        const newStr =
          newValue === null || newValue === undefined
            ? null
            : typeof newValue === "object"
              ? JSON.stringify(newValue)
              : String(newValue);

        // Only track if actually changed
        if (currentStr !== newStr) {
          changes.push({
            fieldName: key,
            fieldLabel: fieldLabels[key] || key,
            previousValue: currentStr,
            newValue: newStr,
          });
          updateData[key] = newValue;
        }
      }

      // If no actual changes, return early
      if (changes.length === 0) {
        return {
          success: true,
          message: "No changes detected",
          changesCount: 0,
        };
      }

      const editHistoryRecords = changes.map((change) => ({
        id: randomUUID(),
        onboardingId: currentOnboarding.id,
        userId,
        fieldName: change.fieldName,
        fieldLabel: change.fieldLabel,
        previousValue: change.previousValue,
        newValue: change.newValue,
        editedAt: new Date(),
      }));

      // Transactional optimistic-concurrency update to avoid lost updates.
      const updatedAtMarker = currentOnboarding.updatedAt;
      const editUpdateResult = await ctx.db.transaction(async (tx) => {
        const updatedRows = await tx
          .update(onboarding)
          .set({
            ...updateData,
            lastEditedAt: new Date(),
            lastEditedBy: userId,
            editCount: sql`((COALESCE(${onboarding.editCount}, '0'))::int + 1)::text`,
          })
          .where(
            and(
              eq(onboarding.id, currentOnboarding.id),
              eq(onboarding.updatedAt, updatedAtMarker)
            )
          )
          .returning({ id: onboarding.id });

        if (updatedRows.length === 0) {
          return { updated: false as const };
        }

        if (editHistoryRecords.length > 0) {
          await tx.insert(onboardingEditHistory).values(editHistoryRecords);
        }

        return { updated: true as const };
      });

      if (!editUpdateResult.updated) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Onboarding was updated by another request. Please refresh and retry.",
        });
      }

      revalidateTag(`onboarding-status-${userId}`, "max");

      console.log(
        `[Onboarding] User ${userId} edited ${changes.length} field(s) on onboarding ${currentOnboarding.id}`
      );

      return {
        success: true,
        message: `Successfully updated ${changes.length} field(s)`,
        changesCount: changes.length,
        changes: changes.map((c) => c.fieldLabel),
      };
    }),
});

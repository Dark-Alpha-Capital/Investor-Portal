import { z } from "zod";
import { randomUUID } from "crypto";
import { baseProcedure, createTRPCRouter } from "../init";
import { onboarding, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { onboardingQueue, emailQueue } from "@/lib/redis";
import { TRPCError } from "@trpc/server";
import {
  EMAIL_CONFIG,
  type OnboardingInvestorConfirmationJobData,
  type OnboardingAdminNotificationJobData,
} from "@repo/mail/types";
import { getSession } from "@/lib/get-session";

// Admin email for onboarding notifications - can be configured via env var
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_CONFIG.defaultAdminEmail;

// Zod schema matching InvestorData type
const investorDataSchema = z.object({
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

// Schema for file uploads
const fileSchema = z.object({
  documentType: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  buffer: z.string(), // base64 encoded
});

// Main onboarding submit schema
const onboardingSubmitSchema = z.object({
  investorData: investorDataSchema,
  files: z.array(fileSchema),
});

export const onboardingRouter = createTRPCRouter({
  submit: baseProcedure
    .input(onboardingSubmitSchema)
    .mutation(async ({ input, ctx }) => {
      const { investorData, files } = input;
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit onboarding",
        });
      }
      const userId = session.user.id;

      // Verify user exists
      const [userRecord] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        throw new Error("User not found");
      }

      // Generate onboarding ID
      const onboardingId = randomUUID();

      // Prepare onboarding data for database
      // Helper to convert empty strings to null for optional fields
      const toNullIfEmpty = (
        value: string | undefined | null
      ): string | null => {
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return null;
        }
        return value;
      };

      // Helper to trim required string fields
      const trimRequired = (value: string | undefined | null): string => {
        if (!value || typeof value !== "string") {
          throw new Error(`Required field is missing or invalid: ${value}`);
        }
        return value.trim();
      };

      const onboardingData = {
        id: onboardingId,
        userId: userId,
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
        supportLetterStages: Array.isArray(investorData.supportLetterStages)
          ? investorData.supportLetterStages
          : [],

        // Section 8: Communication Preferences
        receiveUpdates: trimRequired(investorData.receiveUpdates),
        updateFrequency: toNullIfEmpty(investorData.updateFrequency),
        updateFormat: Array.isArray(investorData.updateFormat)
          ? investorData.updateFormat
          : null,
        industryPreferences: toNullIfEmpty(investorData.industryPreferences),

        // Section 9: Investment Mandate - Size & Structure
        equityCheckSize: trimRequired(investorData.equityCheckSize),
        enterpriseValueRange: toNullIfEmpty(investorData.enterpriseValueRange),
        ebitdaRange: toNullIfEmpty(investorData.ebitdaRange),
        preferredOwnership: trimRequired(investorData.preferredOwnership),
        typicalHoldPeriod: toNullIfEmpty(investorData.typicalHoldPeriod),
        transactionTypes: Array.isArray(investorData.transactionTypes)
          ? investorData.transactionTypes
          : [],
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
        submittedAt: new Date(),
      };

      console.log("onboardingData", JSON.stringify(onboardingData, null, 2));

      // Validate required array fields
      if (!Array.isArray(onboardingData.supportLetterStages)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "supportLetterStages must be an array",
        });
      }
      if (!Array.isArray(onboardingData.transactionTypes)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "transactionTypes must be an array",
        });
      }

      console.log("Saving onboarding data to database");
      try {
        // Save onboarding data to database
        await ctx.db.insert(onboarding).values(onboardingData);
      } catch (error) {
        console.error("Error saving onboarding data to database:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          onboardingData: JSON.stringify(onboardingData, null, 2),
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to save onboarding data to database",
          cause: error,
        });
      }

      // Update user onboarding status

      try {
        await ctx.db
          .update(user)
          .set({
            isOnboardingCompleted: true,
          })
          .where(eq(user.id, userId));
      } catch (error) {
        console.error("Error updating user onboarding status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update user onboarding status",
          cause: error,
        });
      }

      // Queue file uploads if there are any files
      let jobId: string | undefined;
      if (files && files.length > 0) {
        const job = await onboardingQueue.add(
          "upload-onboarding-files",
          {
            onboardingId,
            investorId: userId,
            files: files.map((file) => ({
              documentType: file.documentType,
              fileName: file.name,
              fileBuffer: file.buffer, // Already base64 encoded
              mimeType: file.type,
              size: file.size,
            })),
          },
          {
            removeOnComplete: {
              age: 24 * 3600, // Keep completed jobs for 24 hours
              count: 1000, // Keep last 1000 completed jobs
            },
            removeOnFail: {
              age: 7 * 24 * 3600, // Keep failed jobs for 7 days
            },
          }
        );

        jobId = job.id;
      } else {
        jobId = undefined;
        console.log("No files to upload");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No files to upload, there should be kyc files to upload",
        });
      }

      // Queue notification emails via BullMQ
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
        submittedAt: new Date().toISOString(),
      };

      //emails will be sent to the investor and the admin notifying each of them of the submission
      await Promise.all([
        emailQueue.add("onboarding-investor-confirmation", investorEmailData, {
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        }),
        emailQueue.add("onboarding-admin-notification", adminEmailData, {
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        }),
      ]);

      console.log("Onboarding notification emails queued successfully");

      return {
        success: true,
        message: "Onboarding data submitted successfully",
        onboardingId,
        jobId,
        timestamp: new Date().toISOString(),
        userId,
        fileCount: files?.length || 0,
      };
    }),

  // Get job progress
  getJobProgress: baseProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to get job progress",
        });
      }
      const job = await onboardingQueue.getJob(input.jobId);

      if (!job) {
        throw new Error("Job not found");
      }

      // Verify the job belongs to this user by checking the job data
      const jobData = job.data as {
        investorId: string;
      };

      if (jobData.investorId !== session.user.id) {
        throw new Error("Unauthorized");
      }

      const state = await job.getState();
      const progress = job.progress;

      return {
        jobId: job.id,
        state,
        progress: typeof progress === "number" ? progress : 0,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
      };
    }),
});

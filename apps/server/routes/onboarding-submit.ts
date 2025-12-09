import { Hono } from "hono";
import { db } from "@repo/db";
import { onboarding, onboardingDocument, user } from "@repo/db/schema";
import { uploadPrivateFile } from "../lib/storage.ts";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { OnboardingSubmitSchema } from "../lib/validation.ts";

const onboardingSubmit = new Hono().post("/", async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();

    // Validate payload schema
    const validationResult = OnboardingSubmitSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        {
          success: false,
          error: "Validation Error",
          message: "Invalid request payload",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        400
      );
    }

    const { userId, investorData, files } = validationResult.data;

    // Verify user exists in database
    const [userRecord] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return c.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Invalid user ID",
        },
        401
      );
    }

    // Generate onboarding ID
    const onboardingId = randomUUID();

    // Upload files to Google Cloud Storage (private)
    const uploadedDocuments: Array<{
      documentType: string;
      fileName: string;
      fileSize: string;
      fileType: string;
      fileUrl: string;
    }> = [];

    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (!file.buffer || !file.name || file.size === 0) continue; // Skip empty files

        // Convert base64 buffer to Buffer
        const fileBuffer = Buffer.from(file.buffer, "base64");

        // Upload file as private
        const gcsPath = await uploadPrivateFile(
          fileBuffer,
          `kyc-documents/${userId}/${onboardingId}/${file.name}`,
          file.type || "application/octet-stream"
        );

        if (!gcsPath) {
          console.error(
            `Failed to upload file: ${file.documentType || file.name}`
          );
          continue;
        }

        uploadedDocuments.push({
          documentType: file.documentType || file.name,
          fileName: file.name,
          fileSize: file.size.toString(),
          fileType: file.type || "application/octet-stream",
          fileUrl: gcsPath, // Store GCS path (gs://bucket/path)
        });
      }
    }

    // Prepare onboarding data for database
    const onboardingData = {
      id: onboardingId,
      userId,
      // Section 1: Investor / Lender Details
      organizationName: investorData.organizationName as string,
      primaryContactName: investorData.primaryContactName as string,
      primaryContactTitle: (investorData.primaryContactTitle as string) || null,
      primaryContactEmail: investorData.primaryContactEmail as string,
      primaryContactPhone: investorData.primaryContactPhone as string,
      capitalProviderType: investorData.capitalProviderType as string,
      investorType: investorData.investorType as string,
      geographicFocus: (investorData.geographicFocus as string) || null,

      // Section 2: Independent Sponsor Fit
      openToEmergingSponsor: investorData.openToEmergingSponsor as string,
      minimumRequirements: (investorData.minimumRequirements as string) || null,
      priorDealAttribution: investorData.priorDealAttribution as string,
      priorDealAttributionExplanation:
        (investorData.priorDealAttributionExplanation as string) || null,

      // Section 3: NDAs & Confidentiality
      ndaPreference: investorData.ndaPreference as string,
      ndaLimitations: (investorData.ndaLimitations as string) || null,

      // Section 4: Process & Timing
      timingToLOI: investorData.timingToLOI as string,
      timingToCommitment: investorData.timingToCommitment as string,
      timingDrivers: (investorData.timingDrivers as string) || null,

      // Section 5: Economics
      economicsDescription: investorData.economicsDescription as string,

      // Section 6: Governance & Control
      preferredRole: investorData.preferredRole as string,
      governanceExpectations:
        (investorData.governanceExpectations as string) || null,

      // Section 7: Support Letters
      provideSupportLetter: investorData.provideSupportLetter as string,
      joinBrokerConversations: investorData.joinBrokerConversations as string,
      supportLetterStages: investorData.supportLetterStages as string[],

      // Section 8: Communication Preferences
      receiveUpdates: investorData.receiveUpdates as string,
      updateFrequency: (investorData.updateFrequency as string) || null,
      updateFormat: (investorData.updateFormat as string[]) || null,
      industryPreferences: (investorData.industryPreferences as string) || null,

      // Section 9: Investment Mandate - Size & Structure
      equityCheckSize: investorData.equityCheckSize as string,
      enterpriseValueRange:
        (investorData.enterpriseValueRange as string) || null,
      ebitdaRange: (investorData.ebitdaRange as string) || null,
      preferredOwnership: investorData.preferredOwnership as string,
      typicalHoldPeriod: (investorData.typicalHoldPeriod as string) || null,
      transactionTypes: investorData.transactionTypes as string[],
      leverageTolerance: (investorData.leverageTolerance as string) || null,

      // Section 10: Investment Mandate - Company Profile
      revenueCharacteristics: investorData.revenueCharacteristics as string,
      customerConcentration:
        (investorData.customerConcentration as string) || null,
      marginsAndCashFlow: (investorData.marginsAndCashFlow as string) || null,
      assetProfile: investorData.assetProfile as string,
      managementInvolvement:
        (investorData.managementInvolvement as string) || null,

      // Section 11: Sectors & Themes
      sectorsOfInterest: investorData.sectorsOfInterest as string,
      sectorsToAvoid: (investorData.sectorsToAvoid as string) || null,
      dealSizeThresholds: (investorData.dealSizeThresholds as string) || null,
      specificThemes: (investorData.specificThemes as string) || null,

      // Status
      status: "submitted" as const,
      submittedAt: new Date(),
    };

    // Save onboarding data to database
    await db.insert(onboarding).values(onboardingData);

    await db
      .update(user)
      .set({
        isOnboardingCompleted: true,
      })
      .where(eq(user.id, userId));

    // Save document metadata to database
    if (uploadedDocuments.length > 0) {
      const documentRecords = uploadedDocuments.map((doc) => ({
        id: randomUUID(),
        onboardingId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        fileUrl: doc.fileUrl,
        filePath: null, // Not using local file paths
      }));

      await db.insert(onboardingDocument).values(documentRecords);
    }

    // Log successful submission
    console.log("=".repeat(80));
    console.log("ONBOARDING FORM SUBMISSION SUCCESSFUL");
    console.log("=".repeat(80));
    console.log("Onboarding ID:", onboardingId);
    console.log("User ID:", userId);
    console.log("Timestamp:", new Date().toISOString());
    console.log("Documents uploaded:", uploadedDocuments.length);
    console.log("=".repeat(80));

    return c.json({
      success: true,
      message: "Onboarding data submitted successfully",
      onboardingId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing onboarding submission:", error);
    return c.json(
      {
        success: false,
        error: "Failed to process submission",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      500
    );
  }
});

export default onboardingSubmit;

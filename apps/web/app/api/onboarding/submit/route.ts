import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { onboarding, onboardingDocument, user } from "@repo/db/schema";
import { uploadPrivateFile } from "@/lib/storage";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to submit onboarding data",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();

    // Parse investor data
    let investorData: Record<string, unknown> | null = null;
    const filesToUpload: Array<{ key: string; file: File }> = [];

    // Extract all form fields
    for (const [key, value] of formData.entries()) {
      // Check if value is a File
      if (
        value &&
        typeof value === "object" &&
        "name" in value &&
        "size" in value
      ) {
        // Collect files for upload
        filesToUpload.push({ key, file: value as File });
      } else {
        // Parse investor data JSON
        if (key === "investorData") {
          try {
            investorData = JSON.parse(value as string);
          } catch {
            return NextResponse.json(
              {
                success: false,
                error: "Invalid investor data format",
                message: "Failed to parse investor data",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    if (!investorData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing data",
          message: "Investor data is required",
        },
        { status: 400 }
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

    for (const { key, file } of filesToUpload) {
      if (file.size === 0) continue; // Skip empty files

      // Upload file as private
      const gcsPath = await uploadPrivateFile(
        file,
        `kyc-documents/${userId}/${onboardingId}/${file.name}`
      );

      if (!gcsPath) {
        console.error(`Failed to upload file: ${key}`);
        continue;
      }

      uploadedDocuments.push({
        documentType: key,
        fileName: file.name,
        fileSize: file.size.toString(),
        fileType: file.type,
        fileUrl: gcsPath, // Store GCS path (gs://bucket/path)
      });
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

    return NextResponse.json(
      {
        success: true,
        message: "Onboarding data submitted successfully",
        onboardingId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing onboarding submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process submission",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

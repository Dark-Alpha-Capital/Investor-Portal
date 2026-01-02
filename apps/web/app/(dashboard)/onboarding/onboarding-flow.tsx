"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StepIndicator } from "./step-indicator";
import { Step1AccountProfile } from "./steps/step-1-account-profile";
import { Step2Accreditation } from "./steps/step-2-accreditation";
import { Step3EntityCompliance } from "./steps/step-3-entity-compliance";
import { Step4InvestmentProfile } from "./steps/step-4-investment-profile";
import { StepAttestations } from "./steps/step-attestations";
import { KycDocuments } from "./kyc-documents";
import { OnboardingComplete } from "./onboarding-complete";
import { JobProgressTracker } from "./components/job-progress-tracker";
import { useTRPC } from "@/trpc/client";
import { useJobTracking } from "@/contexts/job-tracking-context";
import { toast } from "sonner";

// Beneficial Owner type for repeating UBO entries
export type BeneficialOwnerData = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  ownershipPercentage: number;
  controlType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  idDocumentType: string;
  isPep: boolean;
  pepDetails: string;
};

// Authorized Signatory type for repeating signatory entries
export type AuthorizedSignatoryData = {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  authorizationScope: string;
};

export type InvestorData = {
  // ======= COMPLIANCE GOVERNANCE FIELDS =======
  // KYC1: Legal Entity Type (driver field)
  legalEntityType?: "individual" | "entity";

  // KYC2: Individual-specific compliance fields
  pepStatus?: boolean;
  pepDetails?: string;
  sourceOfWealthNarrative?: string;

  // KYC7: Mandatory attestations
  accuracyAttestation?: boolean;
  sanctionsDeclaration?: boolean;
  dataConsent?: boolean;

  // Repeating groups (stored separately but tracked here for form state)
  beneficialOwners?: BeneficialOwnerData[];
  authorizedSignatories?: AuthorizedSignatoryData[];

  // ======= ORIGINAL FIELDS =======
  // Section 1: Investor / Lender Details
  organizationName: string;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  capitalProviderType: string;
  investorType: string;
  geographicFocus: string;

  // Step 2: Accreditation & Status
  accreditationStatus?: string;
  accreditationMethod?: string;
  entityTaxId?: string;
  entitySignatoryName?: string;
  entitySignatoryTitle?: string;

  // Section 2: Independent Sponsor Fit
  openToEmergingSponsor: string;
  minimumRequirements: string;
  priorDealAttribution: string;
  priorDealAttributionExplanation: string;

  // Section 3: NDAs & Confidentiality
  ndaPreference: string;
  ndaLimitations: string;

  // Section 4: Process & Timing
  timingToLOI: string;
  timingToCommitment: string;
  timingDrivers: string;

  // Section 5: Economics
  economicsDescription: string;

  // Section 6: Governance & Control
  preferredRole: string;
  governanceExpectations: string;

  // Section 7: Support Letters
  provideSupportLetter: string;
  joinBrokerConversations: string;
  supportLetterStages: string[];

  // Section 8: Communication Preferences
  receiveUpdates: string;
  updateFrequency: string;
  updateFormat: string[];
  industryPreferences: string;

  // Section 9: Investment Mandate - Size & Structure
  equityCheckSize: string;
  enterpriseValueRange: string;
  ebitdaRange: string;
  preferredOwnership: string;
  typicalHoldPeriod: string;
  transactionTypes: string[];
  leverageTolerance: string;

  // Section 10: Investment Mandate - Company Profile
  revenueCharacteristics: string;
  customerConcentration: string;
  marginsAndCashFlow: string;
  assetProfile: string;
  managementInvolvement: string;

  // Section 11: Sectors & Themes
  sectorsOfInterest: string;
  sectorsToAvoid: string;
  dealSizeThresholds: string;
  specificThemes: string;

  // Step 5: Legal & E-Sign
  legalDocumentsAcknowledged?: boolean;
  electronicSignatureName?: string;
  electronicSignatureDate?: string;
};

export type KycData = {
  // Common documents
  identification: File | null;
  proofOfAddress: File | null;

  // Individual Investors
  w9OrW8BEN: File | null;
  fatcaCrsSelfCertification: File | null;
  sourceOfWealthDeclaration: File | null;
  pepDeclaration: File | null;

  // Corporate Entities
  certificateOfIncorporation: File | null;
  certificateOfGoodStanding: File | null;
  registerOfDirectorsShareholders: File | null;
  ownershipChart: File | null;
  companyBylaws: File | null;
  authorizedSignatoryList: File | null;
  uboIdAndAddress: File | null;
  lei: File | null;
  taxFormsCorporate: File | null;
  fatcaCrsCorporate: File | null;

  // Trusts and Foundations
  trustDeed: File | null;
  trustDetails: File | null;
  trustIdAndAddress: File | null;
  taxFormsTrust: File | null;
  sourceOfWealthSettlor: File | null;
  fatcaCrsTrust: File | null;

  // Partnerships or LPs
  partnershipAgreement: File | null;
  certificateOfRegistration: File | null;
  authorizedSignatoryListPartnership: File | null;
  partnerIdAndAddress: File | null;
  ownershipChartPartnership: File | null;
  taxFormsPartnership: File | null;
  fatcaCrsPartnership: File | null;
};

// Step counts based on investor type
// Entity: 1-Account, 2-Accreditation, 3-EntityCompliance, 4-KYCDocs, 5-InvestmentProfile, 6-Attestations, 7-LegalSign
// Individual: 1-Account, 2-Accreditation, 3-KYCDocs, 4-InvestmentProfile, 5-Attestations, 6-LegalSign
const TOTAL_STEPS_ENTITY = 7;
const TOTAL_STEPS_INDIVIDUAL = 6;
const STORAGE_KEY_INVESTOR_DATA = "onboarding_investor_data";
const STORAGE_KEY_STEP = "onboarding_current_step";

const legalSchema = z.object({
  agree: z
    .literal(true)
    .or(z.literal(false))
    .superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "You must agree to the legal disclosures to continue",
          path: [],
        });
      }
    }),
  name: z.string().min(1, "Signature (full legal name) is required").trim(),
  date: z.string().min(1, "Signature date is required"),
});

type OnboardingFlowProps = {
  readOnly?: boolean;
};

export function OnboardingFlow({ readOnly = false }: OnboardingFlowProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = Number.parseInt(searchParams.get("step") || "1");

  const [investorData, setInvestorData] = useState<Partial<InvestorData>>({});
  const [kycData, setKycData] = useState<Partial<KycData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute total steps based on legal entity type
  const isEntityInvestor = investorData.legalEntityType === "entity";
  const totalSteps = isEntityInvestor
    ? TOTAL_STEPS_ENTITY
    : TOTAL_STEPS_INDIVIDUAL;

  // Transition for navigation between steps
  const [isNavigating, startNavigation] = useTransition();

  // Transition for form submission
  const [isSubmitting, startSubmission] = useTransition();

  const [legalData, setLegalData] = useState({
    agree: false,
    name: "",
    date: "",
  });
  const [legalErrors, setLegalErrors] = useState<Record<string, string>>({});

  // tRPC hook
  const trpc = useTRPC();

  // Job tracking context
  const { addJob, getJob } = useJobTracking();
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  // tRPC mutations
  const { mutate: submitOnboarding, isPending: isSubmittingOnboarding } =
    useMutation(
      trpc.onboarding.submit.mutationOptions({
        onSuccess: (data) => {
          console.log("Onboarding submitted successfully:", data);
          // Clear localStorage after successful submission
          // clearLocalStorage();
          // If there are files, add job to tracking
          const jobId = (data as { jobId?: string }).jobId;
          addJob(jobId as string);
          setSubmittedJobId(jobId as string);
          toast.success("Onboarding submitted successfully");
        },
        onError: (error) => {
          console.error("Onboarding submission error:", error);
          toast.error(error.message);
        },
      })
    );

  // Watch job completion from context to mark onboarding as complete
  useEffect(() => {
    if (!submittedJobId) return;

    const checkJob = () => {
      const job = getJob(submittedJobId);
      if (job) {
        if (job.state === "completed") {
          setIsComplete(true);
          setSubmittedJobId(null);
          clearLocalStorage();
          return;
        }
        // Note: We don't mark as complete on failure because
        // the onboarding data was still submitted successfully
        // The user can see the error in the job tracker
      } else {
        // Job not found in context yet, check again
        setTimeout(checkJob, 1000);
      }
    };

    checkJob();
  }, [submittedJobId, getJob]);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedInvestorData = localStorage.getItem(
          STORAGE_KEY_INVESTOR_DATA
        );
        const savedStep = localStorage.getItem(STORAGE_KEY_STEP);

        if (savedInvestorData) {
          const parsed = JSON.parse(savedInvestorData);
          setInvestorData(parsed);
        }

        if (savedStep && Number.parseInt(savedStep) !== currentStep) {
          const step = Number.parseInt(savedStep);
          // Use max possible steps to avoid issues when switching entity type
          const maxSteps = Math.max(TOTAL_STEPS_ENTITY, TOTAL_STEPS_INDIVIDUAL);
          if (step >= 1 && step <= maxSteps) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("step", step.toString());
            router.replace(`${pathname}?${params.toString()}`);
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []); // Only run on mount

  // Save investor data to localStorage whenever it changes
  useEffect(() => {
    if (
      isLoaded &&
      typeof window !== "undefined" &&
      Object.keys(investorData).length > 0
    ) {
      try {
        localStorage.setItem(
          STORAGE_KEY_INVESTOR_DATA,
          JSON.stringify(investorData)
        );
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [investorData, isLoaded]);

  // Save current step to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
      } catch (error) {
        console.error("Error saving step to localStorage:", error);
      }
    }
  }, [currentStep, isLoaded]);

  // Ensure step is valid
  useEffect(() => {
    if (currentStep < 1 || currentStep > totalSteps) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentStep, router, pathname, searchParams, totalSteps]);

  const clearLocalStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_INVESTOR_DATA);
      localStorage.removeItem(STORAGE_KEY_STEP);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the form? All your progress will be lost."
      )
    ) {
      setInvestorData({});
      setKycData({});
      clearLocalStorage();
      router.replace("/onboarding?step=1");
    }
  };

  const navigateToStep = (step: number) => {
    startNavigation(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step.toString());
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleInvestorSubmit = (data: InvestorData) => {
    if (readOnly) return;
    startNavigation(() => {
      // Merge with any existing data so each step adds to the full picture
      setInvestorData((prev) => ({
        ...prev,
        ...data,
      }));
      const params = new URLSearchParams(searchParams.toString());
      const nextStep = Math.min(currentStep + 1, totalSteps);
      params.set("step", nextStep.toString());
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleKycSubmit = async (data: KycData) => {
    if (readOnly) return;
    // Save KYC data and move to next step (no network call yet)
    startNavigation(() => {
      setKycData(data);
      const params = new URLSearchParams(searchParams.toString());
      const nextStep = Math.min(currentStep + 1, totalSteps);
      params.set("step", nextStep.toString());
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleFinalSubmit = async (
    overrideInvestor?: Partial<InvestorData>
  ) => {
    if (readOnly) return;

    try {
      // Convert files to base64
      const filesToProcess: Array<{
        documentType: string;
        name: string;
        type: string;
        size: number;
        buffer: string; // base64 encoded
      }> = [];

      for (const [key, value] of Object.entries(kycData)) {
        if (value instanceof File) {
          const arrayBuffer = await value.arrayBuffer();

          // Convert ArrayBuffer to base64 (browser-compatible)
          const bytes = new Uint8Array(arrayBuffer);
          const binary = bytes.reduce(
            (acc, byte) => acc + String.fromCharCode(byte),
            ""
          );
          const base64Buffer = btoa(binary);

          filesToProcess.push({
            documentType: key,
            name: value.name,
            type: value.type,
            size: value.size,
            buffer: base64Buffer,
          });
        }
      }

      // Merge all investor data
      const mergedData = {
        ...investorData,
        ...overrideInvestor,
      };

      // Validate that all required fields are present
      const requiredFields: (keyof InvestorData)[] = [
        "organizationName",
        "primaryContactName",
        "primaryContactEmail",
        "primaryContactPhone",
        "capitalProviderType",
        "investorType",
        "openToEmergingSponsor",
        "priorDealAttribution",
        "ndaPreference",
        "timingToLOI",
        "timingToCommitment",
        "economicsDescription",
        "preferredRole",
        "provideSupportLetter",
        "joinBrokerConversations",
        "supportLetterStages",
        "receiveUpdates",
        "equityCheckSize",
        "preferredOwnership",
        "transactionTypes",
        "revenueCharacteristics",
        "assetProfile",
        "sectorsOfInterest",
      ];

      const missingFields: string[] = [];
      for (const field of requiredFields) {
        const value = mergedData[field];
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0)
        ) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        alert(
          `Please complete all required fields before submitting. Missing: ${missingFields.join(", ")}`
        );
        // Navigate to the first step with missing data
        if (
          missingFields.some((f) =>
            [
              "organizationName",
              "primaryContactName",
              "primaryContactEmail",
              "primaryContactPhone",
              "capitalProviderType",
              "investorType",
            ].includes(f)
          )
        ) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("step", "1");
          router.push(`${pathname}?${params.toString()}`);
        } else if (
          missingFields.some((f) =>
            [
              "openToEmergingSponsor",
              "priorDealAttribution",
              "ndaPreference",
              "accreditationStatus",
              "accreditationMethod",
            ].includes(f)
          )
        ) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("step", "2");
          router.push(`${pathname}?${params.toString()}`);
        } else {
          const params = new URLSearchParams(searchParams.toString());
          params.set("step", "4");
          router.push(`${pathname}?${params.toString()}`);
        }
        return;
      }

      // Ensure all fields have default values for optional ones and required fields are present
      const fullInvestorData: InvestorData = {
        // ======= COMPLIANCE GOVERNANCE FIELDS =======
        // KYC1: Legal Entity Type
        legalEntityType: mergedData.legalEntityType,

        // KYC2: Individual-specific compliance fields
        pepStatus: mergedData.pepStatus,
        pepDetails: mergedData.pepDetails ?? "",
        sourceOfWealthNarrative: mergedData.sourceOfWealthNarrative ?? "",

        // KYC7: Mandatory attestations
        accuracyAttestation: mergedData.accuracyAttestation,
        sanctionsDeclaration: mergedData.sanctionsDeclaration,
        dataConsent: mergedData.dataConsent,

        // Entity compliance (UBOs and Signatories)
        beneficialOwners: mergedData.beneficialOwners,
        authorizedSignatories: mergedData.authorizedSignatories,

        // ======= ORIGINAL FIELDS =======
        // Required fields - these should be validated above
        organizationName: mergedData.organizationName ?? "",
        primaryContactName: mergedData.primaryContactName ?? "",
        primaryContactEmail: mergedData.primaryContactEmail ?? "",
        primaryContactPhone: mergedData.primaryContactPhone ?? "",
        capitalProviderType: mergedData.capitalProviderType ?? "",
        investorType: mergedData.investorType ?? "",
        openToEmergingSponsor: mergedData.openToEmergingSponsor ?? "",
        priorDealAttribution: mergedData.priorDealAttribution ?? "",
        ndaPreference: mergedData.ndaPreference ?? "",
        timingToLOI: mergedData.timingToLOI ?? "",
        timingToCommitment: mergedData.timingToCommitment ?? "",
        economicsDescription: mergedData.economicsDescription ?? "",
        preferredRole: mergedData.preferredRole ?? "",
        provideSupportLetter: mergedData.provideSupportLetter ?? "",
        joinBrokerConversations: mergedData.joinBrokerConversations ?? "",
        supportLetterStages: mergedData.supportLetterStages ?? [],
        receiveUpdates: mergedData.receiveUpdates ?? "",
        equityCheckSize: mergedData.equityCheckSize ?? "",
        preferredOwnership: mergedData.preferredOwnership ?? "",
        transactionTypes: mergedData.transactionTypes ?? [],
        revenueCharacteristics: mergedData.revenueCharacteristics ?? "",
        assetProfile: mergedData.assetProfile ?? "",
        sectorsOfInterest: mergedData.sectorsOfInterest ?? "",

        // Optional fields with defaults
        primaryContactTitle: mergedData.primaryContactTitle ?? "",
        geographicFocus: mergedData.geographicFocus ?? "",
        accreditationStatus: mergedData.accreditationStatus,
        accreditationMethod: mergedData.accreditationMethod,
        entityTaxId: mergedData.entityTaxId,
        entitySignatoryName: mergedData.entitySignatoryName,
        entitySignatoryTitle: mergedData.entitySignatoryTitle,
        minimumRequirements: mergedData.minimumRequirements ?? "",
        priorDealAttributionExplanation:
          mergedData.priorDealAttributionExplanation ?? "",
        ndaLimitations: mergedData.ndaLimitations ?? "",
        timingDrivers: mergedData.timingDrivers ?? "",
        governanceExpectations: mergedData.governanceExpectations ?? "",
        updateFrequency: mergedData.updateFrequency ?? "",
        updateFormat: mergedData.updateFormat ?? [],
        industryPreferences: mergedData.industryPreferences ?? "",
        enterpriseValueRange: mergedData.enterpriseValueRange ?? "",
        ebitdaRange: mergedData.ebitdaRange ?? "",
        typicalHoldPeriod: mergedData.typicalHoldPeriod ?? "",
        leverageTolerance: mergedData.leverageTolerance ?? "",
        customerConcentration: mergedData.customerConcentration ?? "",
        marginsAndCashFlow: mergedData.marginsAndCashFlow ?? "",
        managementInvolvement: mergedData.managementInvolvement ?? "",
        sectorsToAvoid: mergedData.sectorsToAvoid ?? "",
        dealSizeThresholds: mergedData.dealSizeThresholds ?? "",
        specificThemes: mergedData.specificThemes ?? "",
        legalDocumentsAcknowledged: mergedData.legalDocumentsAcknowledged,
        electronicSignatureName: mergedData.electronicSignatureName,
        electronicSignatureDate: mergedData.electronicSignatureDate,
      };

      console.log("fullInvestorData", fullInvestorData);

      // Submit via tRPC
      submitOnboarding({
        investorData: fullInvestorData,
        files: filesToProcess,
      });
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        error instanceof Error
          ? `Failed to submit: ${error.message}`
          : "Failed to submit onboarding data. Please try again."
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      startNavigation(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", (currentStep - 1).toString());
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  };

  if (isComplete) {
    return <OnboardingComplete />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1" />
          <div className="flex-1 text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {readOnly ? "Onboarding Form (View Only)" : "Investor Onboarding"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? "View the onboarding form structure and questions."
                : "Complete your profile to start your investment journey."}
            </p>
          </div>
          {!readOnly && (
            <div className="flex-1 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Reset form
              </Button>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepClick={readOnly ? undefined : navigateToStep}
          isEntityInvestor={isEntityInvestor}
        />

        {(isNavigating || isSubmittingOnboarding) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {isSubmittingOnboarding ? "Submitting..." : "Loading..."}
            </span>
          </div>
        )}

        <JobProgressTracker />

        {/*
          Step flow based on legal entity type:
          Entity (7 steps): 1-Account, 2-Accreditation, 3-EntityCompliance, 4-KYCDocs, 5-InvestmentProfile, 6-Attestations, 7-LegalSign
          Individual (6 steps): 1-Account, 2-Accreditation, 3-KYCDocs, 4-InvestmentProfile, 5-Attestations, 6-LegalSign
        */}
        <div className="mt-4">
          {/* Step 1: Account Profile (same for both) */}
          {currentStep === 1 && (
            <Step1AccountProfile
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
            />
          )}

          {/* Step 2: Accreditation (same for both) */}
          {currentStep === 2 && (
            <Step2Accreditation
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
            />
          )}

          {/* Step 3: Entity Compliance (only for entities) OR KYC Documents (for individuals) */}
          {currentStep === 3 && isEntityInvestor && (
            <Step3EntityCompliance
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && !isEntityInvestor && (
            <KycDocuments
              initialData={kycData}
              investorType={investorData.investorType || ""}
              onSubmit={handleKycSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step 4: KYC Documents (entity) OR Investment Profile (individual) */}
          {currentStep === 4 && isEntityInvestor && (
            <KycDocuments
              initialData={kycData}
              investorType={investorData.investorType || ""}
              onSubmit={handleKycSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
          {currentStep === 4 && !isEntityInvestor && (
            <Step4InvestmentProfile
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
            />
          )}

          {/* Step 5: Investment Profile (entity) OR Attestations (individual) */}
          {currentStep === 5 && isEntityInvestor && (
            <Step4InvestmentProfile
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && !isEntityInvestor && (
            <StepAttestations
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
              legalEntityType={investorData.legalEntityType}
            />
          )}

          {/* Step 6: Attestations (entity) OR Legal E-Sign (individual) */}
          {currentStep === 6 && isEntityInvestor && (
            <StepAttestations
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
              onBack={handleBack}
              legalEntityType={investorData.legalEntityType}
            />
          )}
          {currentStep === 6 && !isEntityInvestor && !readOnly && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Legal Disclosures & E-Sign
                </h2>
                <p className="text-sm text-muted-foreground">
                  Please confirm that you have reviewed the offering documents
                  and consent to electronic signatures.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                In the next release, this step will be wired to full PPM /
                Operating Agreement / Subscription Agreement review and DocuSign
                or similar. For now, this confirmation records your consent and
                routes your onboarding for compliance review.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="legalAgree"
                      checked={legalData.agree}
                      onCheckedChange={(checked) =>
                        setLegalData((prev) => ({
                          ...prev,
                          agree: Boolean(checked),
                        }))
                      }
                    />
                    <Label
                      htmlFor="legalAgree"
                      className="text-sm font-normal cursor-pointer"
                    >
                      I confirm that I have reviewed the Private Placement
                      Memorandum, Operating Agreement, and Subscription
                      Agreement (as applicable) and agree to receive and sign
                      documents electronically.
                    </Label>
                  </div>
                  {legalErrors.agree && (
                    <p className="text-destructive text-sm flex items-center gap-1">
                      <span>{legalErrors.agree}</span>
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">
                      Signature (full legal name){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="legalName"
                      value={legalData.name}
                      onChange={(e) =>
                        setLegalData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter full legal name"
                      className={legalErrors.name ? "border-destructive" : ""}
                    />
                    {legalErrors.name && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <span>{legalErrors.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalDate">
                      Signature date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="legalDate"
                      type="date"
                      value={legalData.date}
                      onChange={(e) =>
                        setLegalData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className={legalErrors.date ? "border-destructive" : ""}
                    />
                    {legalErrors.date && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <span>{legalErrors.date}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSubmittingOnboarding}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isSubmittingOnboarding}
                  className="flex-1 gap-2"
                  onClick={() => {
                    const result = legalSchema.safeParse(legalData);
                    if (!result.success) {
                      const fieldErrors: Record<string, string> = {};
                      for (const issue of result.error.issues) {
                        const field = issue.path[0];
                        if (typeof field === "string" && !fieldErrors[field]) {
                          fieldErrors[field] = issue.message;
                        }
                      }
                      setLegalErrors(fieldErrors);
                      return;
                    }

                    setLegalErrors({});
                    const override: Partial<InvestorData> = {
                      legalDocumentsAcknowledged: true,
                      electronicSignatureName: result.data.name,
                      electronicSignatureDate: result.data.date,
                    };
                    handleFinalSubmit(override);
                  }}
                >
                  {isSubmittingOnboarding ? "Submitting..." : "Submit & Finish"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Legal E-Sign (entity only) */}
          {currentStep === 7 && isEntityInvestor && !readOnly && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Legal Disclosures & E-Sign
                </h2>
                <p className="text-sm text-muted-foreground">
                  Please confirm that you have reviewed the offering documents
                  and consent to electronic signatures.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                In the next release, this step will be wired to full PPM /
                Operating Agreement / Subscription Agreement review and DocuSign
                or similar. For now, this confirmation records your consent and
                routes your onboarding for compliance review.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="legalAgreeEntity"
                      checked={legalData.agree}
                      onCheckedChange={(checked) =>
                        setLegalData((prev) => ({
                          ...prev,
                          agree: Boolean(checked),
                        }))
                      }
                    />
                    <Label
                      htmlFor="legalAgreeEntity"
                      className="text-sm font-normal cursor-pointer"
                    >
                      I confirm that I have reviewed the Private Placement
                      Memorandum, Operating Agreement, and Subscription
                      Agreement (as applicable) and agree to receive and sign
                      documents electronically.
                    </Label>
                  </div>
                  {legalErrors.agree && (
                    <p className="text-destructive text-sm flex items-center gap-1">
                      <span>{legalErrors.agree}</span>
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalNameEntity">
                      Signature (full legal name){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="legalNameEntity"
                      value={legalData.name}
                      onChange={(e) =>
                        setLegalData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter full legal name"
                      className={legalErrors.name ? "border-destructive" : ""}
                    />
                    {legalErrors.name && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <span>{legalErrors.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalDateEntity">
                      Signature date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="legalDateEntity"
                      type="date"
                      value={legalData.date}
                      onChange={(e) =>
                        setLegalData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className={legalErrors.date ? "border-destructive" : ""}
                    />
                    {legalErrors.date && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <span>{legalErrors.date}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSubmittingOnboarding}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isSubmittingOnboarding}
                  className="flex-1 gap-2"
                  onClick={() => {
                    const result = legalSchema.safeParse(legalData);
                    if (!result.success) {
                      const fieldErrors: Record<string, string> = {};
                      for (const issue of result.error.issues) {
                        const field = issue.path[0];
                        if (typeof field === "string" && !fieldErrors[field]) {
                          fieldErrors[field] = issue.message;
                        }
                      }
                      setLegalErrors(fieldErrors);
                      return;
                    }

                    setLegalErrors({});
                    const override: Partial<InvestorData> = {
                      legalDocumentsAcknowledged: true,
                      electronicSignatureName: result.data.name,
                      electronicSignatureDate: result.data.date,
                    };
                    handleFinalSubmit(override);
                  }}
                >
                  {isSubmittingOnboarding ? "Submitting..." : "Submit & Finish"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

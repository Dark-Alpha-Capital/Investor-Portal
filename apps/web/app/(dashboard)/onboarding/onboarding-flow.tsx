"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StepIndicator } from "./step-indicator";
import { JobProgressTracker } from "./components/job-progress-tracker";
import { useTRPC } from "@/trpc/client";
import { useJobTracking } from "@/contexts/job-tracking-context";
import { toast } from "sonner";
import {
  useOnboardingDataStorage,
  clearOnboardingStorage,
} from "./hooks/use-onboarding-storage";
import { convertFilesToBase64 } from "./utils/file-conversion";
import {
  getCachedLocalStorage,
  setCachedLocalStorage,
} from "./hooks/use-local-storage-cache";

const STORAGE_KEY_STEP = "onboarding_current_step";

// Dynamic imports for heavy step components (bundle optimization 2.4)
const Step1AccountProfile = dynamic(
  () =>
    import("./steps/step-1-account-profile").then((m) => m.Step1AccountProfile),
  { ssr: false }
);
const Step2Accreditation = dynamic(
  () =>
    import("./steps/step-2-accreditation").then((m) => m.Step2Accreditation),
  { ssr: false }
);
const Step3EntityCompliance = dynamic(
  () =>
    import("./steps/step-3-entity-compliance").then(
      (m) => m.Step3EntityCompliance
    ),
  { ssr: false }
);
const Step4InvestmentProfile = dynamic(
  () =>
    import("./steps/step-4-investment-profile").then(
      (m) => m.Step4InvestmentProfile
    ),
  { ssr: false }
);
const StepAttestations = dynamic(
  () => import("./steps/step-attestations").then((m) => m.StepAttestations),
  { ssr: false }
);
const KycDocuments = dynamic(
  () => import("./kyc-documents").then((m) => m.KycDocuments),
  { ssr: false }
);
const OnboardingComplete = dynamic(
  () => import("./onboarding-complete").then((m) => m.OnboardingComplete),
  { ssr: false }
);

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

// Type for existing onboarding data from server
type ExistingOnboardingData = {
  id: string;
  legalEntityType: "individual" | "entity" | null;
  organizationName: string;
  primaryContactName: string;
  primaryContactTitle: string | null;
  primaryContactEmail: string;
  primaryContactPhone: string;
  capitalProviderType: string;
  investorType: string;
  geographicFocus: string | null;
  accreditationStatus: string | null;
  accreditationMethod: string | null;
  entityTaxId: string | null;
  entitySignatoryName: string | null;
  entitySignatoryTitle: string | null;
  pepStatus: boolean | null;
  pepDetails: string | null;
  sourceOfWealthNarrative: string | null;
  accuracyAttestation: boolean | null;
  sanctionsDeclaration: boolean | null;
  dataConsent: boolean | null;
  openToEmergingSponsor: string;
  minimumRequirements: string | null;
  priorDealAttribution: string;
  priorDealAttributionExplanation: string | null;
  ndaPreference: string;
  ndaLimitations: string | null;
  timingToLOI: string;
  timingToCommitment: string;
  timingDrivers: string | null;
  economicsDescription: string;
  preferredRole: string;
  governanceExpectations: string | null;
  provideSupportLetter: string;
  joinBrokerConversations: string;
  supportLetterStages: string[] | null;
  receiveUpdates: string;
  updateFrequency: string | null;
  updateFormat: string[] | null;
  industryPreferences: string | null;
  equityCheckSize: string;
  enterpriseValueRange: string | null;
  ebitdaRange: string | null;
  preferredOwnership: string;
  typicalHoldPeriod: string | null;
  transactionTypes: string[] | null;
  leverageTolerance: string | null;
  revenueCharacteristics: string;
  customerConcentration: string | null;
  marginsAndCashFlow: string | null;
  assetProfile: string;
  managementInvolvement: string | null;
  sectorsOfInterest: string;
  sectorsToAvoid: string | null;
  dealSizeThresholds: string | null;
  specificThemes: string | null;
  legalDocumentsAcknowledged: boolean | null;
  electronicSignatureName: string | null;
  electronicSignatureDate: string | null;
  [key: string]: unknown;
};

type OnboardingFlowProps = {
  readOnly?: boolean;
  editMode?: boolean;
  existingOnboarding?: ExistingOnboardingData;
};

export function OnboardingFlow({
  readOnly = false,
  editMode = false,
  existingOnboarding,
}: OnboardingFlowProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = Number.parseInt(searchParams.get("step") || "1");

  // Use cached localStorage hook with lazy initialization
  const [investorData, setInvestorData] = useOnboardingDataStorage<
    Partial<InvestorData>
  >(
    {},
    editMode // Skip saving in edit mode
  );
  const [kycData, setKycData] = useState<Partial<KycData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasRestoredStep, setHasRestoredStep] = useState(false);

  // Memoize computed values (re-render optimization 5.1)
  const isEntityInvestor = useMemo(
    () => investorData.legalEntityType === "entity",
    [investorData.legalEntityType]
  );
  const totalSteps = useMemo(
    () => (isEntityInvestor ? TOTAL_STEPS_ENTITY : TOTAL_STEPS_INDIVIDUAL),
    [isEntityInvestor]
  );

  // Hoist static arrays outside component (rendering optimization 6.3, JS performance 7.1)
  const REQUIRED_FIELDS = useMemo<(keyof InvestorData)[]>(
    () => [
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
    ],
    []
  );

  // Hoist static Sets for O(1) lookups (JS performance 7.11)
  const STEP1_FIELDS = useMemo(
    () =>
      new Set([
        "organizationName",
        "primaryContactName",
        "primaryContactEmail",
        "primaryContactPhone",
        "capitalProviderType",
        "investorType",
      ]),
    []
  );
  const STEP2_FIELDS = useMemo(
    () =>
      new Set([
        "openToEmergingSponsor",
        "priorDealAttribution",
        "ndaPreference",
        "accreditationStatus",
        "accreditationMethod",
      ]),
    []
  );
  const SKIP_FIELDS = useMemo(
    () => new Set(["beneficialOwners", "authorizedSignatories"]),
    []
  );

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

  // Update mutation for edit mode
  const { mutate: updateOnboarding, isPending: isUpdatingOnboarding } =
    useMutation(
      trpc.onboarding.updateOnboarding.mutationOptions({
        onSuccess: (result) => {
          console.log("Onboarding updated successfully:", result);
          toast.success(result.message || "Onboarding updated successfully");
          setIsComplete(true);
        },
        onError: (error) => {
          console.error("Onboarding update error:", error);
          toast.error(error.message || "Failed to update onboarding");
        },
      })
    );

  // Memoize clearLocalStorage callback (re-render optimization 5.5)
  const clearLocalStorage = useCallback(() => {
    clearOnboardingStorage();
  }, []);

  // Watch job completion from context to mark onboarding as complete
  // Narrow dependencies - only depend on submittedJobId (best practice 5.3)
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
  }, [submittedJobId, getJob, clearLocalStorage]);

  // Memoize conversion function (re-render optimization 5.2)
  const convertExistingToInvestorData = useCallback(
    (existing: ExistingOnboardingData): Partial<InvestorData> => {
      return {
        legalEntityType: existing.legalEntityType ?? undefined,
        organizationName: existing.organizationName,
        primaryContactName: existing.primaryContactName,
        primaryContactTitle: existing.primaryContactTitle ?? "",
        primaryContactEmail: existing.primaryContactEmail,
        primaryContactPhone: existing.primaryContactPhone,
        capitalProviderType: existing.capitalProviderType,
        investorType: existing.investorType,
        geographicFocus: existing.geographicFocus ?? "",
        accreditationStatus: existing.accreditationStatus ?? undefined,
        accreditationMethod: existing.accreditationMethod ?? undefined,
        entityTaxId: existing.entityTaxId ?? undefined,
        entitySignatoryName: existing.entitySignatoryName ?? undefined,
        entitySignatoryTitle: existing.entitySignatoryTitle ?? undefined,
        pepStatus: existing.pepStatus ?? undefined,
        pepDetails: existing.pepDetails ?? "",
        sourceOfWealthNarrative: existing.sourceOfWealthNarrative ?? "",
        accuracyAttestation: existing.accuracyAttestation ?? undefined,
        sanctionsDeclaration: existing.sanctionsDeclaration ?? undefined,
        dataConsent: existing.dataConsent ?? undefined,
        openToEmergingSponsor: existing.openToEmergingSponsor,
        minimumRequirements: existing.minimumRequirements ?? "",
        priorDealAttribution: existing.priorDealAttribution,
        priorDealAttributionExplanation:
          existing.priorDealAttributionExplanation ?? "",
        ndaPreference: existing.ndaPreference,
        ndaLimitations: existing.ndaLimitations ?? "",
        timingToLOI: existing.timingToLOI,
        timingToCommitment: existing.timingToCommitment,
        timingDrivers: existing.timingDrivers ?? "",
        economicsDescription: existing.economicsDescription,
        preferredRole: existing.preferredRole,
        governanceExpectations: existing.governanceExpectations ?? "",
        provideSupportLetter: existing.provideSupportLetter,
        joinBrokerConversations: existing.joinBrokerConversations,
        supportLetterStages: existing.supportLetterStages ?? [],
        receiveUpdates: existing.receiveUpdates,
        updateFrequency: existing.updateFrequency ?? "",
        updateFormat: existing.updateFormat ?? [],
        industryPreferences: existing.industryPreferences ?? "",
        equityCheckSize: existing.equityCheckSize,
        enterpriseValueRange: existing.enterpriseValueRange ?? "",
        ebitdaRange: existing.ebitdaRange ?? "",
        preferredOwnership: existing.preferredOwnership,
        typicalHoldPeriod: existing.typicalHoldPeriod ?? "",
        transactionTypes: existing.transactionTypes ?? [],
        leverageTolerance: existing.leverageTolerance ?? "",
        revenueCharacteristics: existing.revenueCharacteristics,
        customerConcentration: existing.customerConcentration ?? "",
        marginsAndCashFlow: existing.marginsAndCashFlow ?? "",
        assetProfile: existing.assetProfile,
        managementInvolvement: existing.managementInvolvement ?? "",
        sectorsOfInterest: existing.sectorsOfInterest,
        sectorsToAvoid: existing.sectorsToAvoid ?? "",
        dealSizeThresholds: existing.dealSizeThresholds ?? "",
        specificThemes: existing.specificThemes ?? "",
        legalDocumentsAcknowledged:
          existing.legalDocumentsAcknowledged ?? undefined,
        electronicSignatureName: existing.electronicSignatureName ?? undefined,
        electronicSignatureDate: existing.electronicSignatureDate ?? undefined,
      };
    },
    []
  );

  // Load data from existingOnboarding in edit mode (narrow dependencies 5.3)
  useEffect(() => {
    if (editMode && existingOnboarding) {
      const converted = convertExistingToInvestorData(existingOnboarding);
      setInvestorData(converted);
      setIsLoaded(true);
      setHasRestoredStep(true); // Skip step restoration in edit mode
    } else if (!editMode) {
      setIsLoaded(true);
    }
  }, [
    editMode,
    existingOnboarding,
    convertExistingToInvestorData,
    setInvestorData,
  ]);

  // Restore step from localStorage only on initial load (only in normal mode)
  // This should only run once when the component first loads, not on every step change
  useEffect(() => {
    if (
      editMode ||
      typeof window === "undefined" ||
      !isLoaded ||
      hasRestoredStep
    )
      return;

    try {
      const savedStep = getCachedLocalStorage(STORAGE_KEY_STEP);
      if (savedStep) {
        const step = Number.parseInt(savedStep);
        const maxSteps = Math.max(TOTAL_STEPS_ENTITY, TOTAL_STEPS_INDIVIDUAL);
        // Only restore if URL doesn't have a step param or if saved step is different
        // and we haven't restored yet
        const urlStep = searchParams.get("step");
        if (
          !urlStep ||
          (step >= 1 && step <= maxSteps && step !== currentStep)
        ) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("step", step.toString());
          router.replace(`${pathname}?${params.toString()}`);
          setHasRestoredStep(true);
        } else {
          setHasRestoredStep(true);
        }
      } else {
        setHasRestoredStep(true);
      }
    } catch (error) {
      console.error("Error restoring step:", error);
      setHasRestoredStep(true);
    }
  }, [
    editMode,
    isLoaded,
    hasRestoredStep,
    currentStep,
    pathname,
    router,
    searchParams,
  ]);

  // Save current step to localStorage (skip in edit mode)
  // Note: investorData is handled by useOnboardingDataStorage hook
  useEffect(() => {
    if (!editMode && isLoaded && typeof window !== "undefined") {
      try {
        setCachedLocalStorage(STORAGE_KEY_STEP, currentStep.toString());
      } catch (error) {
        console.error("Error saving step to localStorage:", error);
      }
    }
  }, [currentStep, isLoaded, editMode]);

  // Ensure step is valid
  useEffect(() => {
    if (currentStep < 1 || currentStep > totalSteps) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentStep, router, pathname, searchParams, totalSteps]);

  // Memoize callbacks to prevent unnecessary re-renders (re-render optimization 5.5)
  const handleReset = useCallback(() => {
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
  }, [setInvestorData, clearLocalStorage, router]);

  const navigateToStep = useCallback(
    (step: number) => {
      // Update localStorage immediately when user clicks a step header
      // This prevents the restore effect from interfering
      if (!editMode && typeof window !== "undefined") {
        try {
          setCachedLocalStorage(STORAGE_KEY_STEP, step.toString());
        } catch (error) {
          console.error("Error saving step to localStorage:", error);
        }
      }

      startNavigation(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", step.toString());
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router, editMode]
  );

  const handleInvestorSubmit = useCallback(
    (data: InvestorData) => {
      if (readOnly) return;
      startNavigation(() => {
        // Functional setState to prevent stale closures (best practice 5.5)
        setInvestorData((prev) => ({
          ...prev,
          ...data,
        }));
        const params = new URLSearchParams(searchParams.toString());
        const nextStep = Math.min(currentStep + 1, totalSteps);
        params.set("step", nextStep.toString());
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [
      readOnly,
      currentStep,
      totalSteps,
      searchParams,
      pathname,
      router,
      setInvestorData,
    ]
  );

  const handleKycSubmit = useCallback(
    async (data: KycData) => {
      if (readOnly) return;
      // Save KYC data and move to next step (no network call yet)
      startNavigation(() => {
        setKycData(data);
        const params = new URLSearchParams(searchParams.toString());
        const nextStep = Math.min(currentStep + 1, totalSteps);
        params.set("step", nextStep.toString());
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [readOnly, currentStep, totalSteps, searchParams, pathname, router]
  );

  const handleFinalSubmit = useCallback(
    async (overrideInvestor?: Partial<InvestorData>) => {
      if (readOnly) return;

      try {
        // Convert files to base64 in parallel (best practice 1.4)
        const filesToProcess = await convertFilesToBase64(kycData);

        // Merge all investor data using functional setState pattern
        const mergedData = {
          ...investorData,
          ...overrideInvestor,
        };

        // Validate that all required fields are present
        // Use hoisted REQUIRED_FIELDS array (rendering optimization 6.3)
        const missingFields: string[] = [];
        // Cache array length check (JS performance 7.6)
        const requiredFieldsLength = REQUIRED_FIELDS.length;
        for (let i = 0; i < requiredFieldsLength; i++) {
          const field = REQUIRED_FIELDS[i];
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
          toast.error(
            `Please complete all required fields before submitting. Missing: ${missingFields.join(", ")}`
          );
          // Navigate to the first step with missing data
          // Use hoisted Sets for O(1) lookups (best practice 7.11)
          const params = new URLSearchParams(searchParams.toString());
          // Early exit optimization (JS performance 7.7)
          if (missingFields.some((f) => STEP1_FIELDS.has(f))) {
            params.set("step", "1");
          } else if (missingFields.some((f) => STEP2_FIELDS.has(f))) {
            params.set("step", "2");
          } else {
            params.set("step", "4");
          }
          router.push(`${pathname}?${params.toString()}`);
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

        // In edit mode, call updateOnboarding instead of submit
        if (editMode) {
          // Convert InvestorData to update schema format (only send changed/filled fields)
          // Use hoisted SKIP_FIELDS Set for O(1) lookups (best practice 7.11)
          const updateData: Record<string, unknown> = {};
          // Cache object entries iteration (JS performance 7.2)
          const entries = Object.entries(fullInvestorData);
          const entriesLength = entries.length;
          for (let i = 0; i < entriesLength; i++) {
            const [key, value] = entries[i];
            if (SKIP_FIELDS.has(key)) continue;
            if (value !== undefined && value !== null) {
              updateData[key] = value;
            }
          }

          updateOnboarding(
            updateData as Parameters<typeof updateOnboarding>[0]
          );
          return;
        }

        // Submit via tRPC (new onboarding)
        submitOnboarding({
          investorData: fullInvestorData,
          files: filesToProcess,
        });
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(
          error instanceof Error
            ? `Failed to submit: ${error.message}`
            : "Failed to submit onboarding data. Please try again."
        );
      }
    },
    [
      readOnly,
      kycData,
      investorData,
      editMode,
      searchParams,
      pathname,
      router,
      updateOnboarding,
      submitOnboarding,
      REQUIRED_FIELDS,
      STEP1_FIELDS,
      STEP2_FIELDS,
      SKIP_FIELDS,
    ]
  );

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      startNavigation(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", (currentStep - 1).toString());
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  }, [currentStep, searchParams, pathname, router]);

  if (isComplete) {
    // In edit mode, show a different completion screen
    if (editMode) {
      return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">
              Changes Saved Successfully
            </h1>
            <p className="text-muted-foreground">
              Your onboarding information has been updated.
            </p>
            <Button asChild>
              <a href="/onboarding">Back to Onboarding</a>
            </Button>
          </div>
        </div>
      );
    }
    return <OnboardingComplete />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {editMode && (
              <Button asChild variant="ghost" size="sm">
                <a href="/onboarding">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </a>
              </Button>
            )}
          </div>
          <div className="flex-1 text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {readOnly
                ? "Onboarding Form (View Only)"
                : editMode
                  ? "Edit Onboarding"
                  : "Investor Onboarding"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? "View the onboarding form structure and questions."
                : editMode
                  ? "Update your investor profile information."
                  : "Complete your profile to start your investment journey."}
            </p>
          </div>
          {!readOnly && !editMode && (
            <div className="flex-1 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Reset form
              </Button>
            </div>
          )}
          {editMode && <div className="flex-1" />}
        </div>

        {/* Progress Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepClick={readOnly ? undefined : navigateToStep}
          isEntityInvestor={isEntityInvestor}
        />

        {(isNavigating || isSubmittingOnboarding || isUpdatingOnboarding) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {isSubmittingOnboarding
                ? "Submitting..."
                : isUpdatingOnboarding
                  ? "Saving changes..."
                  : "Loading..."}
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
          {currentStep === 3 && !isEntityInvestor && !editMode && (
            <KycDocuments
              initialData={kycData}
              investorType={investorData.investorType || ""}
              onSubmit={handleKycSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
          {/* In edit mode for individual: skip KYC step */}
          {currentStep === 3 && !isEntityInvestor && editMode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">KYC Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Your KYC documents have already been uploaded. You can proceed
                  to review your investment profile.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  To upload new documents or update existing ones, please
                  contact support.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBack}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigateToStep(4)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: KYC Documents (entity) OR Investment Profile (individual) */}
          {currentStep === 4 && isEntityInvestor && !editMode && (
            <KycDocuments
              initialData={kycData}
              investorType={investorData.investorType || ""}
              onSubmit={handleKycSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
          {/* In edit mode for entity: skip KYC step */}
          {currentStep === 4 && isEntityInvestor && editMode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">KYC Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Your KYC documents have already been uploaded. You can proceed
                  to review your investment profile.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  To upload new documents or update existing ones, please
                  contact support.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBack}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigateToStep(5)}
                >
                  Continue
                </Button>
              </div>
            </div>
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
          {/* Edit mode for individual - final step with Save Changes */}
          {currentStep === 6 && !isEntityInvestor && editMode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Review & Save Changes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review your changes and save them to update your onboarding
                  information.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  Your legal disclosures and e-signature from your original
                  submission remain on file. Only the profile data you&apos;ve
                  changed will be updated.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBack}
                  disabled={isUpdatingOnboarding}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isUpdatingOnboarding}
                  className="flex-1 gap-2"
                  onClick={() => handleFinalSubmit()}
                >
                  {isUpdatingOnboarding ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          )}
          {currentStep === 6 && !isEntityInvestor && !readOnly && !editMode && (
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
                  variant="secondary"
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
                    void handleFinalSubmit(override);
                  }}
                >
                  {isSubmittingOnboarding ? "Submitting..." : "Submit & Finish"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Legal E-Sign (entity only) */}
          {/* Edit mode for entity - final step with Save Changes */}
          {currentStep === 7 && isEntityInvestor && editMode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Review & Save Changes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review your changes and save them to update your onboarding
                  information.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  Your legal disclosures and e-signature from your original
                  submission remain on file. Only the profile data you&apos;ve
                  changed will be updated.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBack}
                  disabled={isUpdatingOnboarding}
                  className="gap-2 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isUpdatingOnboarding}
                  className="flex-1 gap-2"
                  onClick={() => handleFinalSubmit()}
                >
                  {isUpdatingOnboarding ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          )}
          {currentStep === 7 && isEntityInvestor && !readOnly && !editMode && (
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
                  variant="secondary"
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
                    void handleFinalSubmit(override);
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

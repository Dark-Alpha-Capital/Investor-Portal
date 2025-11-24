"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { InvestorQuestionnaire } from "./investor-questionaire";
import { KycDocuments } from "./kyc-documents";
import { OnboardingComplete } from "./onboarding-complete";

export type InvestorData = {
  // Section 1: Investor / Lender Details
  organizationName: string;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  capitalProviderType: string;
  investorType: string;
  geographicFocus: string;

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

const TOTAL_STEPS = 2;
const STORAGE_KEY_INVESTOR_DATA = "onboarding_investor_data";
const STORAGE_KEY_STEP = "onboarding_current_step";

export function OnboardingFlow() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = Number.parseInt(searchParams.get("step") || "1");

  const [investorData, setInvestorData] = useState<Partial<InvestorData>>({});
  const [kycData, setKycData] = useState<Partial<KycData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Transition for navigation between steps
  const [isNavigating, startNavigation] = useTransition();

  // Transition for form submission
  const [isSubmitting, startSubmission] = useTransition();

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
          if (step >= 1 && step <= TOTAL_STEPS) {
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
    if (currentStep < 1 || currentStep > TOTAL_STEPS) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentStep, router, pathname, searchParams]);

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
    startNavigation(() => {
      setInvestorData(data);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", "2");
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleKycSubmit = async (data: KycData) => {
    startSubmission(async () => {
      setKycData(data);

      try {
        // Prepare FormData for file uploads
        const formData = new FormData();

        // Add investor data as JSON string
        formData.append("investorData", JSON.stringify(investorData));

        // Add KYC data - files and metadata
        Object.entries(data).forEach(([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value !== null) {
            formData.append(key, String(value));
          }
        });

        formData.append("submittedAt", new Date().toISOString());

        // Submit to API route
        const response = await fetch("/api/onboarding/submit", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to submit onboarding data"
          );
        }

        const result = await response.json();
        console.log("Onboarding submission successful:", result);

        // Clear localStorage after successful submission
        clearLocalStorage();
        setIsComplete(true);
      } catch (error) {
        console.error("Submission error:", error);
        alert(
          error instanceof Error
            ? `Failed to submit: ${error.message}`
            : "Failed to submit onboarding data. Please try again."
        );
      }
    });
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                {"Investor Onboarding"}
              </h1>
              <p className="text-muted-foreground text-balance">
                {"Complete your profile to start your investment journey"}
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Reset Form
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <Card className="p-6 sm:p-8 mt-8 relative">
          {(isNavigating || isSubmitting) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {isNavigating ? "Loading..." : "Submitting..."}
                </p>
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <InvestorQuestionnaire
              initialData={investorData}
              onSubmit={handleInvestorSubmit}
            />
          )}
          {currentStep === 2 && (
            <KycDocuments
              initialData={kycData}
              investorType={investorData.investorType || ""}
              onSubmit={handleKycSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

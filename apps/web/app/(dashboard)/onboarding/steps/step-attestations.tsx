"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InvestorData } from "../onboarding-flow";
import { AlertCircle, ArrowRight, ShieldCheck, FileCheck, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type StepAttestationsProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack: () => void;
  legalEntityType?: "individual" | "entity";
};

export function StepAttestations({
  initialData,
  onSubmit,
  onBack,
  legalEntityType,
}: StepAttestationsProps) {
  // For individuals only
  const [pepStatus, setPepStatus] = useState(initialData.pepStatus || false);
  const [pepDetails, setPepDetails] = useState(initialData.pepDetails || "");
  const [sourceOfWealthNarrative, setSourceOfWealthNarrative] = useState(
    initialData.sourceOfWealthNarrative || ""
  );

  // Mandatory attestations for all
  const [accuracyAttestation, setAccuracyAttestation] = useState(
    initialData.accuracyAttestation || false
  );
  const [sanctionsDeclaration, setSanctionsDeclaration] = useState(
    initialData.sanctionsDeclaration || false
  );
  const [dataConsent, setDataConsent] = useState(
    initialData.dataConsent || false
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoize isIndividual computation (re-render optimization 5.1)
  const isIndividual = useMemo(
    () => legalEntityType === "individual",
    [legalEntityType]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      // Validate mandatory attestations - early exit pattern (JS performance 7.7)
      if (!accuracyAttestation) {
        newErrors.accuracyAttestation =
          "You must confirm the accuracy of information provided";
      }
      if (!sanctionsDeclaration) {
        newErrors.sanctionsDeclaration =
          "You must confirm the sanctions/AML declaration";
      }
      if (!dataConsent) {
        newErrors.dataConsent =
          "You must consent to data processing to proceed";
      }

      // For individuals, validate PEP details if PEP status is true
      if (isIndividual && pepStatus && !pepDetails.trim()) {
        newErrors.pepDetails =
          "Please provide details about your PEP status";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      onSubmit({
        ...initialData,
        pepStatus: isIndividual ? pepStatus : undefined,
        pepDetails: isIndividual ? pepDetails : undefined,
        sourceOfWealthNarrative: isIndividual ? sourceOfWealthNarrative : undefined,
        accuracyAttestation,
        sanctionsDeclaration,
        dataConsent,
      } as InvestorData);
    },
    [
      accuracyAttestation,
      sanctionsDeclaration,
      dataConsent,
      isIndividual,
      pepStatus,
      pepDetails,
      sourceOfWealthNarrative,
      initialData,
      onSubmit,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Compliance Declarations & Attestations
        </h2>
        <p className="text-muted-foreground text-sm">
          Please review and complete the required compliance declarations below.
          These are mandatory for regulatory compliance.
        </p>
      </div>

      {/* Individual-specific compliance fields */}
      {isIndividual && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Individual Investor Declarations
          </h3>

          {/* PEP Status */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="pepStatus"
                checked={pepStatus}
                onCheckedChange={(checked) => setPepStatus(Boolean(checked))}
              />
              <div className="space-y-1">
                <Label htmlFor="pepStatus" className="font-medium cursor-pointer">
                  I am a Politically Exposed Person (PEP)
                </Label>
                <p className="text-sm text-muted-foreground">
                  A PEP is an individual who holds or has held a prominent public
                  function (e.g., head of state, senior politician, senior
                  government official, judicial or military official, senior
                  executive of state-owned corporation, important political party
                  official). This also includes close family members and close
                  associates of such persons.
                </p>
              </div>
            </div>

            {pepStatus && (
              <div className="ml-7 space-y-2">
                <Label htmlFor="pepDetails">
                  PEP Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="pepDetails"
                  value={pepDetails}
                  onChange={(e) => setPepDetails(e.target.value)}
                  placeholder="Please describe the nature of your PEP status, including the position held, the country, and the dates of service..."
                  rows={3}
                  className={errors.pepDetails ? "border-destructive" : ""}
                />
                {errors.pepDetails && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.pepDetails}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Source of Wealth */}
          <div className="space-y-2">
            <Label htmlFor="sourceOfWealth">Source of Wealth Narrative</Label>
            <p className="text-sm text-muted-foreground">
              Please describe the origin of your wealth and how it was acquired.
              This helps us comply with anti-money laundering regulations.
            </p>
            <Textarea
              id="sourceOfWealth"
              value={sourceOfWealthNarrative}
              onChange={(e) => setSourceOfWealthNarrative(e.target.value)}
              placeholder="e.g., Employment income, business ownership, inheritance, investment returns, real estate sales..."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Mandatory Attestations Section (KYC7) */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">
          Mandatory Attestations
        </h3>

        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Required for Compliance
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            All three attestations below are mandatory and must be acknowledged
            to proceed with your onboarding.
          </AlertDescription>
        </Alert>

        {/* 1. Accuracy of Information */}
        <div
          className={`space-y-3 p-4 border rounded-lg ${
            errors.accuracyAttestation
              ? "border-destructive bg-destructive/5"
              : ""
          }`}
        >
          <div className="flex items-start space-x-3">
            <Checkbox
              id="accuracyAttestation"
              checked={accuracyAttestation}
              onCheckedChange={(checked) =>
                setAccuracyAttestation(Boolean(checked))
              }
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <Label
                  htmlFor="accuracyAttestation"
                  className="font-medium cursor-pointer"
                >
                  Accuracy of Information{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                I certify that all information provided in this onboarding
                application is true, accurate, and complete to the best of my
                knowledge. I understand that providing false or misleading
                information may result in the rejection of my application and
                potential legal consequences.
              </p>
            </div>
          </div>
          {errors.accuracyAttestation && (
            <p className="text-destructive text-sm flex items-center gap-1 ml-7">
              <AlertCircle className="w-4 h-4" />
              {errors.accuracyAttestation}
            </p>
          )}
        </div>

        {/* 2. Sanctions/AML Declaration */}
        <div
          className={`space-y-3 p-4 border rounded-lg ${
            errors.sanctionsDeclaration
              ? "border-destructive bg-destructive/5"
              : ""
          }`}
        >
          <div className="flex items-start space-x-3">
            <Checkbox
              id="sanctionsDeclaration"
              checked={sanctionsDeclaration}
              onCheckedChange={(checked) =>
                setSanctionsDeclaration(Boolean(checked))
              }
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <Label
                  htmlFor="sanctionsDeclaration"
                  className="font-medium cursor-pointer"
                >
                  Sanctions & Anti-Money Laundering Declaration{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                I declare that neither I, nor any beneficial owner, director,
                officer, or authorized representative of the investing entity
                (if applicable):
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                <li>
                  Is listed on any sanctions list maintained by OFAC, the UN, EU,
                  UK, or other applicable jurisdictions
                </li>
                <li>
                  Is located, organized, or resident in a country subject to
                  comprehensive sanctions
                </li>
                <li>
                  Is directly or indirectly owned or controlled by any person or
                  entity subject to sanctions
                </li>
                <li>
                  Has engaged in or will use investment funds for money
                  laundering, terrorism financing, or other illegal activities
                </li>
              </ul>
            </div>
          </div>
          {errors.sanctionsDeclaration && (
            <p className="text-destructive text-sm flex items-center gap-1 ml-7">
              <AlertCircle className="w-4 h-4" />
              {errors.sanctionsDeclaration}
            </p>
          )}
        </div>

        {/* 3. Data Processing Consent */}
        <div
          className={`space-y-3 p-4 border rounded-lg ${
            errors.dataConsent ? "border-destructive bg-destructive/5" : ""
          }`}
        >
          <div className="flex items-start space-x-3">
            <Checkbox
              id="dataConsent"
              checked={dataConsent}
              onCheckedChange={(checked) => setDataConsent(Boolean(checked))}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <Label
                  htmlFor="dataConsent"
                  className="font-medium cursor-pointer"
                >
                  Consent for Data Processing{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                I consent to the collection, processing, and storage of my
                personal and financial information for the purposes of:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                <li>
                  Identity verification and Know Your Customer (KYC) compliance
                </li>
                <li>Anti-money laundering (AML) screening and monitoring</li>
                <li>
                  Investor suitability assessment and accreditation verification
                </li>
                <li>
                  Communication regarding investment opportunities and portfolio
                  management
                </li>
                <li>
                  Sharing with regulatory authorities as required by applicable
                  law
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                I understand that I may withdraw this consent at any time,
                subject to legal and contractual restrictions, by contacting the
                compliance team.
              </p>
            </div>
          </div>
          {errors.dataConsent && (
            <p className="text-destructive text-sm flex items-center gap-1 ml-7">
              <AlertCircle className="w-4 h-4" />
              {errors.dataConsent}
            </p>
          )}
        </div>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold text-destructive">
              Please fix the following errors:
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="bg-transparent"
        >
          Back
        </Button>
        <Button type="submit" size="lg" className="gap-2">
          <span>Save & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

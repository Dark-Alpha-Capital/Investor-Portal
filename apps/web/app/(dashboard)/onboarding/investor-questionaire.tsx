"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { InvestorData } from "./onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";

type InvestorQuestionnaireProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
};

export function InvestorQuestionnaire({
  initialData,
  onSubmit,
}: InvestorQuestionnaireProps) {
  const [formData, setFormData] = useState<Partial<InvestorData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof InvestorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleArrayField = (field: keyof InvestorData, value: string) => {
    const currentValues = (formData[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setFormData((prev) => ({ ...prev, [field]: newValues }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Section 1 - Required fields
    if (!formData.organizationName?.trim())
      newErrors.organizationName = "Organization name is required";
    if (!formData.primaryContactName?.trim())
      newErrors.primaryContactName = "Primary contact name is required";
    if (!formData.primaryContactEmail?.trim()) {
      newErrors.primaryContactEmail = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryContactEmail)
    ) {
      newErrors.primaryContactEmail = "Please enter a valid email";
    }
    if (!formData.primaryContactPhone?.trim())
      newErrors.primaryContactPhone = "Phone is required";
    if (!formData.capitalProviderType)
      newErrors.capitalProviderType = "Capital provider type is required";
    if (!formData.investorType)
      newErrors.investorType = "Investor type is required";

    // Section 2
    if (!formData.openToEmergingSponsor)
      newErrors.openToEmergingSponsor = "Please select an option";
    if (!formData.priorDealAttribution)
      newErrors.priorDealAttribution = "Please select an option";

    // Section 3
    if (!formData.ndaPreference)
      newErrors.ndaPreference = "Please select an NDA preference";

    // Section 4
    if (!formData.timingToLOI)
      newErrors.timingToLOI = "Please select timing to LOI";
    if (!formData.timingToCommitment)
      newErrors.timingToCommitment = "Please select timing to commitment";

    // Section 5
    if (!formData.economicsDescription?.trim())
      newErrors.economicsDescription = "Please describe economics";

    // Section 6
    if (!formData.preferredRole)
      newErrors.preferredRole = "Please select preferred role";

    // Section 7
    if (!formData.provideSupportLetter)
      newErrors.provideSupportLetter = "Please select an option";
    if (!formData.joinBrokerConversations)
      newErrors.joinBrokerConversations = "Please select an option";
    if (
      !formData.supportLetterStages ||
      formData.supportLetterStages.length === 0
    ) {
      newErrors.supportLetterStages = "Please select at least one stage";
    }

    // Section 8
    if (!formData.receiveUpdates)
      newErrors.receiveUpdates = "Please select an option";
    if (formData.receiveUpdates === "yes") {
      if (!formData.updateFrequency)
        newErrors.updateFrequency = "Please select update frequency";
      if (!formData.updateFormat || formData.updateFormat.length === 0) {
        newErrors.updateFormat = "Please select at least one format";
      }
    }

    // Section 9
    if (!formData.equityCheckSize?.trim())
      newErrors.equityCheckSize = "Please provide equity check size";
    if (!formData.preferredOwnership)
      newErrors.preferredOwnership = "Please select preferred ownership";
    if (!formData.transactionTypes || formData.transactionTypes.length === 0) {
      newErrors.transactionTypes =
        "Please select at least one transaction type";
    }

    // Section 10
    if (!formData.revenueCharacteristics?.trim())
      newErrors.revenueCharacteristics =
        "Please describe revenue characteristics";
    if (!formData.assetProfile)
      newErrors.assetProfile = "Please select asset profile";

    // Section 11
    if (!formData.sectorsOfInterest?.trim())
      newErrors.sectorsOfInterest = "Please list sectors of interest";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as InvestorData);
    } else {
      // Scroll to first error that still persists
      // Wait for React to update the DOM with error messages
      setTimeout(() => {
        // Get the first error key from the current errors state
        const firstErrorKey = Object.keys(errors)[0];

        if (firstErrorKey) {
          let targetElement: HTMLElement | null = null;

          // Try to find the input/field element by ID (most fields have IDs matching error keys)
          targetElement = document.getElementById(firstErrorKey) as HTMLElement;

          // If not found by ID, try to find by name attribute
          if (!targetElement) {
            targetElement = document.querySelector(
              `[name="${firstErrorKey}"]`
            ) as HTMLElement;
          }

          // If still not found, find the error message element and scroll to its container
          if (!targetElement) {
            // Find all error message elements
            const errorMessages = Array.from(
              document.querySelectorAll("p.text-destructive.text-sm")
            ) as HTMLElement[];

            // Find the first visible error message (they're conditionally rendered)
            // Since errors are set by validate(), visible error messages are current errors
            const firstVisibleError = errorMessages.find((msg) => {
              const text = msg.textContent || "";
              // Check if this error message text matches any current error
              return Object.values(errors).some((errorText) =>
                text.includes(errorText as string)
              );
            });

            if (firstVisibleError) {
              // Find the container (space-y-2 div) that holds this error
              const container = firstVisibleError.closest(
                ".space-y-2"
              ) as HTMLElement;
              targetElement = container || firstVisibleError;
            }
          }

          // Fallback: find first element with error border styling
          if (!targetElement) {
            targetElement = document.querySelector(
              'input.border-destructive, textarea.border-destructive, [class*="border-destructive"]'
            ) as HTMLElement;
          }

          // Scroll to the target element
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Investor / Lender Questionnaire
        </h2>
        <p className="text-muted-foreground text-sm">
          Please provide detailed information to help us understand your
          investment criteria and preferences
        </p>
      </div>

      {/* Section 1: Investor / Lender Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          1. Investor / Lender Details
        </h3>

        <div className="space-y-2">
          <Label htmlFor="organizationName">
            Organization name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="organizationName"
            value={formData.organizationName || ""}
            onChange={(e) => updateField("organizationName", e.target.value)}
            placeholder="Enter organization name"
            className={errors.organizationName ? "border-destructive" : ""}
          />
          {errors.organizationName && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.organizationName}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryContactName">
              Primary contact name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="primaryContactName"
              value={formData.primaryContactName || ""}
              onChange={(e) =>
                updateField("primaryContactName", e.target.value)
              }
              placeholder="Full name"
              className={errors.primaryContactName ? "border-destructive" : ""}
            />
            {errors.primaryContactName && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.primaryContactName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryContactTitle">Primary contact title</Label>
            <Input
              id="primaryContactTitle"
              value={formData.primaryContactTitle || ""}
              onChange={(e) =>
                updateField("primaryContactTitle", e.target.value)
              }
              placeholder="Title"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryContactEmail">
              Primary contact email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="primaryContactEmail"
              type="email"
              value={formData.primaryContactEmail || ""}
              onChange={(e) =>
                updateField("primaryContactEmail", e.target.value)
              }
              placeholder="email@example.com"
              className={errors.primaryContactEmail ? "border-destructive" : ""}
            />
            {errors.primaryContactEmail && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.primaryContactEmail}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryContactPhone">
              Primary contact phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="primaryContactPhone"
              type="tel"
              value={formData.primaryContactPhone || ""}
              onChange={(e) =>
                updateField("primaryContactPhone", e.target.value)
              }
              placeholder="+1 (555) 000-0000"
              className={errors.primaryContactPhone ? "border-destructive" : ""}
            />
            {errors.primaryContactPhone && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.primaryContactPhone}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capitalProviderType">
            Type of capital provider <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.capitalProviderType}
            onValueChange={(value) => updateField("capitalProviderType", value)}
            className={
              errors.capitalProviderType
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {[
              "Family Office",
              "PE Fund",
              "Credit Fund",
              "Bank",
              "SBIC",
              "Other",
            ].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={type.toLowerCase().replace(" ", "-")}
                  id={type}
                />
                <Label htmlFor={type} className="font-normal cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.capitalProviderType && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.capitalProviderType}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="investorType">
            Investor type <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.investorType}
            onValueChange={(value) => updateField("investorType", value)}
            className={
              errors.investorType
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {[
              "Individual investor including HNWI's",
              "Corporate Entities(LLC's, Corporations)",
              "Trusts and foundations",
              "Partnerships or LP's",
            ].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={type
                    .toLowerCase()
                    .replace(/[()']/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/,/g, "")}
                  id={`investor-type-${type}`}
                />
                <Label
                  htmlFor={`investor-type-${type}`}
                  className="font-normal cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.investorType && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.investorType}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="geographicFocus">Geographic focus (if any)</Label>
          <Input
            id="geographicFocus"
            value={formData.geographicFocus || ""}
            onChange={(e) => updateField("geographicFocus", e.target.value)}
            placeholder="e.g., North America, Europe, Asia-Pacific"
          />
        </div>
      </div>

      {/* Section 2: Independent Sponsor Fit */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          2. Independent Sponsor Fit
        </h3>

        <div className="space-y-2">
          <Label>
            Are you open to working with emerging independent sponsors?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.openToEmergingSponsor}
            onValueChange={(value) =>
              updateField("openToEmergingSponsor", value)
            }
            className={
              errors.openToEmergingSponsor
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="sponsor-yes" />
              <Label
                htmlFor="sponsor-yes"
                className="font-normal cursor-pointer"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="sponsor-no" />
              <Label
                htmlFor="sponsor-no"
                className="font-normal cursor-pointer"
              >
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="case-by-case" id="sponsor-case" />
              <Label
                htmlFor="sponsor-case"
                className="font-normal cursor-pointer"
              >
                Case-by-case
              </Label>
            </div>
          </RadioGroup>
          {errors.openToEmergingSponsor && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.openToEmergingSponsor}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumRequirements">
            Minimum requirements (if any)
          </Label>
          <Textarea
            id="minimumRequirements"
            value={formData.minimumRequirements || ""}
            onChange={(e) => updateField("minimumRequirements", e.target.value)}
            placeholder="e.g., prior deal count, fund size, co-investment expectations"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Does attribution from our team members prior deals matter to you?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.priorDealAttribution}
            onValueChange={(value) =>
              updateField("priorDealAttribution", value)
            }
            className={
              errors.priorDealAttribution
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="attribution-yes" />
              <Label
                htmlFor="attribution-yes"
                className="font-normal cursor-pointer"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="attribution-no" />
              <Label
                htmlFor="attribution-no"
                className="font-normal cursor-pointer"
              >
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somewhat" id="attribution-somewhat" />
              <Label
                htmlFor="attribution-somewhat"
                className="font-normal cursor-pointer"
              >
                Somewhat
              </Label>
            </div>
          </RadioGroup>
          {errors.priorDealAttribution && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.priorDealAttribution}
            </p>
          )}
        </div>

        {formData.priorDealAttribution === "somewhat" && (
          <div className="space-y-2">
            <Label htmlFor="priorDealAttributionExplanation">
              Please explain briefly
            </Label>
            <Textarea
              id="priorDealAttributionExplanation"
              value={formData.priorDealAttributionExplanation || ""}
              onChange={(e) =>
                updateField("priorDealAttributionExplanation", e.target.value)
              }
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Section 3: NDAs & Confidentiality */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          3. NDAs & Confidentiality
        </h3>

        <div className="space-y-2">
          <Label>
            NDA preference <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.ndaPreference}
            onValueChange={(value) => updateField("ndaPreference", value)}
            className={
              errors.ndaPreference
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="nda-general" />
              <Label
                htmlFor="nda-general"
                className="font-normal cursor-pointer"
              >
                Yes, general NDA is fine
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="deal-by-deal" id="nda-deal" />
              <Label htmlFor="nda-deal" className="font-normal cursor-pointer">
                Prefer deal-by-deal NDAs
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="nda-other" />
              <Label htmlFor="nda-other" className="font-normal cursor-pointer">
                Other
              </Label>
            </div>
          </RadioGroup>
          {errors.ndaPreference && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.ndaPreference}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ndaLimitations">
            Standard limitations or requirements
          </Label>
          <Textarea
            id="ndaLimitations"
            value={formData.ndaLimitations || ""}
            onChange={(e) => updateField("ndaLimitations", e.target.value)}
            placeholder="e.g., term, carve-outs, internal sharing"
            rows={2}
          />
        </div>
      </div>

      {/* Section 4: Process & Timing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          4. Process & Timing
        </h3>

        <div className="space-y-2">
          <Label>
            From initial materials to non-binding support letter / indication of
            interest <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.timingToLOI}
            onValueChange={(value) => updateField("timingToLOI", value)}
            className={
              errors.timingToLOI
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {["< 1 week", "1-2 weeks", "2-4 weeks", "> 4 weeks"].map(
              (timing) => (
                <div key={timing} className="flex items-center space-x-2">
                  <RadioGroupItem value={timing} id={`loi-${timing}`} />
                  <Label
                    htmlFor={`loi-${timing}`}
                    className="font-normal cursor-pointer"
                  >
                    {timing}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
          {errors.timingToLOI && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.timingToLOI}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            From completion of due diligence to definitive commitment{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.timingToCommitment}
            onValueChange={(value) => updateField("timingToCommitment", value)}
            className={
              errors.timingToCommitment
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {["< 1 week", "1-2 weeks", "2-4 weeks", "> 4 weeks"].map(
              (timing) => (
                <div key={timing} className="flex items-center space-x-2">
                  <RadioGroupItem value={timing} id={`commitment-${timing}`} />
                  <Label
                    htmlFor={`commitment-${timing}`}
                    className="font-normal cursor-pointer"
                  >
                    {timing}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
          {errors.timingToCommitment && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.timingToCommitment}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timingDrivers">What drives timing? (optional)</Label>
          <Textarea
            id="timingDrivers"
            value={formData.timingDrivers || ""}
            onChange={(e) => updateField("timingDrivers", e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Section 5: Economics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          5. Economics with Independent Sponsors
        </h3>

        <div className="space-y-2">
          <Label htmlFor="economicsDescription">
            What economics do you consider fair for an independent sponsor?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="economicsDescription"
            value={formData.economicsDescription || ""}
            onChange={(e) =>
              updateField("economicsDescription", e.target.value)
            }
            placeholder="e.g., closing/transaction fee ranges, ongoing fees, promote/carried interest, co-investment requirements"
            rows={4}
            className={errors.economicsDescription ? "border-destructive" : ""}
          />
          {errors.economicsDescription && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.economicsDescription}
            </p>
          )}
        </div>
      </div>

      {/* Section 6: Governance & Control */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          6. Governance & Control Preferences
        </h3>

        <div className="space-y-2">
          <Label>
            For new platforms, what is your preferred role?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.preferredRole}
            onValueChange={(value) => updateField("preferredRole", value)}
            className={
              errors.preferredRole
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {[
              "Lead / majority control",
              "Co-control",
              "Significant minority with board seat",
              "Minority without board seat",
              "Flexible / situation-dependent",
            ].map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={role
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/\//g, "")}
                  id={role}
                />
                <Label htmlFor={role} className="font-normal cursor-pointer">
                  {role}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.preferredRole && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.preferredRole}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="governanceExpectations">
            Standard governance expectations
          </Label>
          <Textarea
            id="governanceExpectations"
            value={formData.governanceExpectations || ""}
            onChange={(e) =>
              updateField("governanceExpectations", e.target.value)
            }
            placeholder="e.g., board representation, veto rights, information rights"
            rows={3}
          />
        </div>
      </div>

      {/* Section 7: Support Letters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          7. Support Letters & Broker Engagement
        </h3>

        <div className="space-y-2">
          <Label>
            Would you provide a general support letter indicating interest in
            partnering? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.provideSupportLetter}
            onValueChange={(value) =>
              updateField("provideSupportLetter", value)
            }
            className={
              errors.provideSupportLetter
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {["Yes", "No", "Possibly, case-by-case"].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.toLowerCase().replace(/,\s+/g, "-")}
                  id={`support-${option}`}
                />
                <Label
                  htmlFor={`support-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.provideSupportLetter && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.provideSupportLetter}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Are you open to joining select broker conversations?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.joinBrokerConversations}
            onValueChange={(value) =>
              updateField("joinBrokerConversations", value)
            }
            className={
              errors.joinBrokerConversations
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {["Yes", "No", "Case-by-case"].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.toLowerCase().replace("-", "")}
                  id={`broker-${option}`}
                />
                <Label
                  htmlFor={`broker-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.joinBrokerConversations && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.joinBrokerConversations}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            At what stage are you comfortable providing a deal-specific support
            letter? <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            {[
              "After teaser, to obtain CIM",
              "After initial review of CIM",
              "With IOI / term sheet",
              "After management meeting",
              "After signing LOI",
              "After confirmatory diligence begins",
              "Only after diligence is substantially complete",
            ].map((stage) => (
              <div key={stage} className="flex items-center space-x-2">
                <Checkbox
                  id={stage}
                  checked={formData.supportLetterStages?.includes(stage)}
                  onCheckedChange={() =>
                    toggleArrayField("supportLetterStages", stage)
                  }
                />
                <label
                  htmlFor={stage}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {stage}
                </label>
              </div>
            ))}
          </div>
          {errors.supportLetterStages && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.supportLetterStages}
            </p>
          )}
        </div>
      </div>

      {/* Section 8: Communication Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          8. Communication Preferences
        </h3>

        <div className="space-y-2">
          <Label>
            Would you like to receive updates on our deal flow and pipeline?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.receiveUpdates}
            onValueChange={(value) => updateField("receiveUpdates", value)}
            className={
              errors.receiveUpdates
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="updates-yes" />
              <Label
                htmlFor="updates-yes"
                className="font-normal cursor-pointer"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="updates-no" />
              <Label
                htmlFor="updates-no"
                className="font-normal cursor-pointer"
              >
                No
              </Label>
            </div>
          </RadioGroup>
          {errors.receiveUpdates && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.receiveUpdates}
            </p>
          )}
        </div>

        {formData.receiveUpdates === "yes" && (
          <>
            <div className="space-y-2">
              <Label>
                Preferred frequency <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.updateFrequency}
                onValueChange={(value) => updateField("updateFrequency", value)}
                className={
                  errors.updateFrequency
                    ? "border border-destructive rounded-md p-2"
                    : ""
                }
              >
                {["Deal-by-deal only", "Monthly", "Quarterly"].map((freq) => (
                  <div key={freq} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={freq.toLowerCase().replace(/\s+/g, "-")}
                      id={freq}
                    />
                    <Label
                      htmlFor={freq}
                      className="font-normal cursor-pointer"
                    >
                      {freq}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.updateFrequency && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.updateFrequency}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Preferred format <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {[
                  "Email summaries",
                  "One-page deal briefs",
                  "Group update calls",
                  "1:1 calls as needed",
                ].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={format}
                      checked={formData.updateFormat?.includes(format)}
                      onCheckedChange={() =>
                        toggleArrayField("updateFormat", format)
                      }
                    />
                    <label
                      htmlFor={format}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {format}
                    </label>
                  </div>
                ))}
              </div>
              {errors.updateFormat && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.updateFormat}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industryPreferences">
                Industry or deal-type preferences / exclusions
              </Label>
              <Textarea
                id="industryPreferences"
                value={formData.industryPreferences || ""}
                onChange={(e) =>
                  updateField("industryPreferences", e.target.value)
                }
                rows={2}
              />
            </div>
          </>
        )}
      </div>

      {/* Section 9: Investment Mandate - Size & Structure */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          9. Investment Mandate – Size & Structure
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="equityCheckSize">
              Typical equity check size{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="equityCheckSize"
              value={formData.equityCheckSize || ""}
              onChange={(e) => updateField("equityCheckSize", e.target.value)}
              placeholder="e.g., $5M - $20M"
              className={errors.equityCheckSize ? "border-destructive" : ""}
            />
            {errors.equityCheckSize && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.equityCheckSize}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enterpriseValueRange">
              Typical enterprise value range
            </Label>
            <Input
              id="enterpriseValueRange"
              value={formData.enterpriseValueRange || ""}
              onChange={(e) =>
                updateField("enterpriseValueRange", e.target.value)
              }
              placeholder="e.g., $25M - $100M"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ebitdaRange">Typical EBITDA range</Label>
            <Input
              id="ebitdaRange"
              value={formData.ebitdaRange || ""}
              onChange={(e) => updateField("ebitdaRange", e.target.value)}
              placeholder="e.g., $3M - $15M"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typicalHoldPeriod">Typical hold period</Label>
            <Input
              id="typicalHoldPeriod"
              value={formData.typicalHoldPeriod || ""}
              onChange={(e) => updateField("typicalHoldPeriod", e.target.value)}
              placeholder="e.g., 5-7 years"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Preferred ownership <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.preferredOwnership}
            onValueChange={(value) => updateField("preferredOwnership", value)}
            className={
              errors.preferredOwnership
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {["Majority", "Co-control", "Minority", "Flexible"].map(
              (ownership) => (
                <div key={ownership} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={ownership.toLowerCase()}
                    id={ownership}
                  />
                  <Label
                    htmlFor={ownership}
                    className="font-normal cursor-pointer"
                  >
                    {ownership}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
          {errors.preferredOwnership && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.preferredOwnership}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Preferred transaction types{" "}
            <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            {[
              "Control buyout / LBO",
              "Growth equity",
              "Minority recapitalization",
              "Co-investment alongside another sponsor",
              "Credit / debt-only",
            ].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={formData.transactionTypes?.includes(type)}
                  onCheckedChange={() =>
                    toggleArrayField("transactionTypes", type)
                  }
                />
                <label
                  htmlFor={type}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
          {errors.transactionTypes && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.transactionTypes}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="leverageTolerance">
            High-level leverage tolerance
          </Label>
          <Input
            id="leverageTolerance"
            value={formData.leverageTolerance || ""}
            onChange={(e) => updateField("leverageTolerance", e.target.value)}
            placeholder='e.g., "up to ~3.0x senior / 4.0x total"'
          />
        </div>
      </div>

      {/* Section 10: Investment Mandate - Company Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          10. Investment Mandate – Company Profile
        </h3>

        <div className="space-y-2">
          <Label htmlFor="revenueCharacteristics">
            Revenue characteristics <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="revenueCharacteristics"
            value={formData.revenueCharacteristics || ""}
            onChange={(e) =>
              updateField("revenueCharacteristics", e.target.value)
            }
            placeholder="e.g., recurring/contractual, project-based, transactional; comfort with project-based revenue when risks are mitigated"
            rows={3}
            className={
              errors.revenueCharacteristics ? "border-destructive" : ""
            }
          />
          {errors.revenueCharacteristics && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.revenueCharacteristics}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerConcentration">Customer concentration</Label>
          <Input
            id="customerConcentration"
            value={formData.customerConcentration || ""}
            onChange={(e) =>
              updateField("customerConcentration", e.target.value)
            }
            placeholder="e.g., maximum 25% from single customer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marginsAndCashFlow">
            Margins & cash flow expectations
          </Label>
          <Textarea
            id="marginsAndCashFlow"
            value={formData.marginsAndCashFlow || ""}
            onChange={(e) => updateField("marginsAndCashFlow", e.target.value)}
            placeholder="e.g., minimum EBITDA margin, FCF conversion expectations"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Asset profile <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.assetProfile}
            onValueChange={(value) => updateField("assetProfile", value)}
            className={
              errors.assetProfile
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            {[
              "Prefer asset-light businesses",
              "Comfortable with asset-heavy",
              "Either, case-by-case",
            ].map((profile) => (
              <div key={profile} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={profile
                    .toLowerCase()
                    .replace(/,\s+/g, "-")
                    .replace(/\s+/g, "-")}
                  id={profile}
                />
                <Label htmlFor={profile} className="font-normal cursor-pointer">
                  {profile}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.assetProfile && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.assetProfile}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="managementInvolvement">
            Management / owner involvement
          </Label>
          <Textarea
            id="managementInvolvement"
            value={formData.managementInvolvement || ""}
            onChange={(e) =>
              updateField("managementInvolvement", e.target.value)
            }
            placeholder="e.g., founder stays and rolls equity, management re-up, openness to full founder transition"
            rows={2}
          />
        </div>
      </div>

      {/* Section 11: Sectors & Themes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          11. Sectors & Current Themes
        </h3>

        <div className="space-y-2">
          <Label htmlFor="sectorsOfInterest">
            Sectors / subsectors of highest interest{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="sectorsOfInterest"
            value={formData.sectorsOfInterest || ""}
            onChange={(e) => updateField("sectorsOfInterest", e.target.value)}
            placeholder="e.g., Healthcare services, B2B software, Industrial services"
            rows={3}
            className={errors.sectorsOfInterest ? "border-destructive" : ""}
          />
          {errors.sectorsOfInterest && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.sectorsOfInterest}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectorsToAvoid">
            Sectors or themes you generally avoid
          </Label>
          <Textarea
            id="sectorsToAvoid"
            value={formData.sectorsToAvoid || ""}
            onChange={(e) => updateField("sectorsToAvoid", e.target.value)}
            placeholder="e.g., Retail, Real estate, Highly regulated industries"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealSizeThresholds">
            Deals that are too small or too large
          </Label>
          <Input
            id="dealSizeThresholds"
            value={formData.dealSizeThresholds || ""}
            onChange={(e) => updateField("dealSizeThresholds", e.target.value)}
            placeholder="e.g., Too small < $2M equity check, Too large > $50M"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specificThemes">
            Specific themes or deal types focused on over next 12-24 months
          </Label>
          <Textarea
            id="specificThemes"
            value={formData.specificThemes || ""}
            onChange={(e) => updateField("specificThemes", e.target.value)}
            placeholder="e.g., Digital transformation, ESG-focused businesses, founder-owned businesses"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" size="lg" className="gap-2">
          Continue to KYC Verification
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

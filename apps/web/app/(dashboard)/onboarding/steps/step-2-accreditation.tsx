"use client";

import type React from "react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InvestorData } from "../onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";

type Step2AccreditationProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack?: () => void;
};

const step2Schema = z
  .object({
    investorType: z.string().optional(),
    openToEmergingSponsor: z
      .string()
      .min(1, "Please select an option for emerging sponsors"),
    minimumRequirements: z.string().optional().or(z.literal("")),
    priorDealAttribution: z
      .string()
      .min(1, "Please select an option for prior deal attribution"),
    priorDealAttributionExplanation: z
      .string()
      .optional()
      .or(z.literal("")),
    ndaPreference: z
      .string()
      .min(1, "Please select an NDA preference"),
    ndaLimitations: z.string().optional().or(z.literal("")),
    accreditationStatus: z
      .string()
      .min(1, "Please select how you qualify as an accredited investor"),
    accreditationMethod: z
      .string()
      .min(1, "Please select how accreditation will be verified"),
    entityTaxId: z.string().optional(),
    entitySignatoryName: z.string().optional(),
    entitySignatoryTitle: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isEntity =
      data.investorType &&
      data.investorType !==
        "individual-investor-including-hnwis".toLowerCase();

    if (isEntity) {
      if (!data.entityTaxId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entityTaxId"],
          message: "Tax ID / EIN is required for entity investors",
        });
      }
      if (!data.entitySignatoryName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entitySignatoryName"],
          message: "Authorized signatory name is required",
        });
      }
    }
  });

export function Step2Accreditation({
  initialData,
  onSubmit,
  onBack,
}: Step2AccreditationProps) {
  const [formData, setFormData] = useState<Partial<InvestorData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof InvestorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = step2Schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);

      const firstErrorKey = Object.keys(fieldErrors)[0];
      if (firstErrorKey) {
        setTimeout(() => {
          let targetElement: HTMLElement | null =
            (document.getElementById(firstErrorKey) as HTMLElement) || null;

          if (!targetElement) {
            targetElement = document.querySelector(
              `[name="${firstErrorKey}"]`
            ) as HTMLElement;
          }

          if (!targetElement) {
            const errorMessage = document.querySelector(
              `[data-error-for="${firstErrorKey}"]`
            ) as HTMLElement;
            if (errorMessage) {
              const container = errorMessage.closest(
                ".space-y-2"
              ) as HTMLElement;
              targetElement = container || errorMessage;
            }
          }

          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 0);
      }

      return;
    }

    onSubmit(result.data as InvestorData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Accreditation & Qualification
        </h2>
        <p className="text-muted-foreground text-sm">
          Please provide the information below to help us understand your
          investor profile and preferences.
        </p>
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

      {/* Section 4: Accreditation Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          4. Accreditation Status
        </h3>

        <div className="space-y-2">
          <Label>
            How do you (or your entity) qualify as an accredited investor?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.accreditationStatus}
            onValueChange={(value) => updateField("accreditationStatus", value)}
            className={
              errors.accreditationStatus
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income_individual" id="acc-income-individual" />
                <Label
                  htmlFor="acc-income-individual"
                  className="font-normal cursor-pointer"
                >
                  Individual income &gt;= $200,000 in each of the last 2 years
                  (with expectation to continue)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income_joint" id="acc-income-joint" />
                <Label
                  htmlFor="acc-income-joint"
                  className="font-normal cursor-pointer"
                >
                  Joint income with spouse/partner &gt;= $300,000 in each of
                  the last 2 years (with expectation to continue)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="net_worth" id="acc-net-worth" />
                <Label
                  htmlFor="acc-net-worth"
                  className="font-normal cursor-pointer"
                >
                  Net worth over $1,000,000 (excluding primary residence)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non_us_equivalent" id="acc-non-us" />
                <Label
                  htmlFor="acc-non-us"
                  className="font-normal cursor-pointer"
                >
                  Non-U.S. investor meeting equivalent local accredited /
                  professional investor thresholds
                </Label>
              </div>
            </div>
          </RadioGroup>
          {errors.accreditationStatus && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.accreditationStatus}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            How will accreditation be verified?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.accreditationMethod}
            onValueChange={(value) => updateField("accreditationMethod", value)}
            className={
              errors.accreditationMethod
                ? "border border-destructive rounded-md p-2"
                : ""
            }
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cpa_letter" id="acc-method-cpa" />
                <Label
                  htmlFor="acc-method-cpa"
                  className="font-normal cursor-pointer"
                >
                  Letter from CPA
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attorney_letter" id="acc-method-attorney" />
                <Label
                  htmlFor="acc-method-attorney"
                  className="font-normal cursor-pointer"
                >
                  Letter from attorney
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="broker_letter" id="acc-method-broker" />
                <Label
                  htmlFor="acc-method-broker"
                  className="font-normal cursor-pointer"
                >
                  Letter from registered broker-dealer / investment advisor
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="financial_statements"
                  id="acc-method-financials"
                />
                <Label
                  htmlFor="acc-method-financials"
                  className="font-normal cursor-pointer"
                >
                  Financial statements / documentation package
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="acc-method-other" />
                <Label
                  htmlFor="acc-method-other"
                  className="font-normal cursor-pointer"
                >
                  Other (to be agreed with OneBridge Capital)
                </Label>
              </div>
            </div>
          </RadioGroup>
          {errors.accreditationMethod && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.accreditationMethod}
            </p>
          )}
        </div>

        {(formData.investorType &&
          formData.investorType !==
            "individual-investor-including-hnwis") && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">
              Entity details (for corporate / trust / partnership investors)
            </h4>
            <div className="space-y-2">
              <Label htmlFor="entityTaxId">
                Tax ID / EIN{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="entityTaxId"
                value={formData.entityTaxId || ""}
                onChange={(e) => updateField("entityTaxId", e.target.value)}
                placeholder="e.g., 12-3456789"
                className={errors.entityTaxId ? "border-destructive" : ""}
              />
              {errors.entityTaxId && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.entityTaxId}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entitySignatoryName">
                  Authorized signatory name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entitySignatoryName"
                  value={formData.entitySignatoryName || ""}
                  onChange={(e) =>
                    updateField("entitySignatoryName", e.target.value)
                  }
                  placeholder="Full legal name"
                  className={
                    errors.entitySignatoryName ? "border-destructive" : ""
                  }
                />
                {errors.entitySignatoryName && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.entitySignatoryName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="entitySignatoryTitle">
                  Authorized signatory title
                </Label>
                <Input
                  id="entitySignatoryTitle"
                  value={formData.entitySignatoryTitle || ""}
                  onChange={(e) =>
                    updateField("entitySignatoryTitle", e.target.value)
                  }
                  placeholder="e.g., Managing Member, Director"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t gap-3">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="bg-transparent"
          >
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit" size="lg" className="gap-2">
          <span>Save & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}


"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InvestorData } from "../onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";

// Hoist static arrays (rendering optimization 6.3, JS performance 7.1)
const EMERGING_SPONSOR_OPTIONS = ["yes", "no", "case-by-case"] as const;
const PRIOR_DEAL_OPTIONS = ["yes", "no", "somewhat"] as const;
const NDA_OPTIONS = ["general", "deal-by-deal", "other"] as const;

type Step2AccreditationProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack?: () => void;
};

const step2Schema = z
  .object({
    legalEntityType: z.enum(["individual", "entity"]).optional(),
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
    // Use legalEntityType to determine if entity-specific fields are required
    const isEntity = data.legalEntityType === "entity";

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

  // Memoize updateField callback (re-render optimization 5.5)
  const updateField = useCallback(
    (field: keyof InvestorData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        // Early exit if no error to clear (JS performance 7.7)
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  // Memoize scroll to error function (re-render optimization 5.2)
  const scrollToError = useCallback((firstErrorKey: string) => {
    setTimeout(() => {
      let targetElement: HTMLElement | null = document.querySelector(
        `[data-field="${firstErrorKey}"]`
      ) as HTMLElement;

      if (!targetElement) {
        targetElement = document.getElementById(firstErrorKey) as HTMLElement;
      }

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
            ".space-y-4, .space-y-2"
          ) as HTMLElement;
          targetElement = container || errorMessage;
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const result = step2Schema.safeParse(formData);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        // Cache issues array length (JS performance 7.6)
        const issues = result.error.issues;
        const issuesLength = issues.length;
        for (let i = 0; i < issuesLength; i++) {
          const issue = issues[i];
          const field = issue.path[0];
          // Early exit if already has error (JS performance 7.7)
          if (typeof field === "string" && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);

        // Scroll to first error
        const firstErrorKey = Object.keys(fieldErrors)[0];
        if (firstErrorKey) {
          scrollToError(firstErrorKey);
        }

        return;
      }

      onSubmit(result.data as InvestorData);
    },
    [formData, onSubmit, scrollToError]
  );

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
            {EMERGING_SPONSOR_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`sponsor-${option}`} />
                <Label
                  htmlFor={`sponsor-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option === "case-by-case" ? "Case-by-case" : option.charAt(0).toUpperCase() + option.slice(1)}
                </Label>
              </div>
            ))}
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
            {PRIOR_DEAL_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`attribution-${option}`} />
                <Label
                  htmlFor={`attribution-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Label>
              </div>
            ))}
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
            {NDA_OPTIONS.map((option) => {
              const labels: Record<string, string> = {
                general: "Yes, general NDA is fine",
                "deal-by-deal": "Prefer deal-by-deal NDAs",
                other: "Other",
              };
              return (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`nda-${option}`} />
                  <Label
                    htmlFor={`nda-${option}`}
                    className="font-normal cursor-pointer"
                  >
                    {labels[option]}
                  </Label>
                </div>
              );
            })}
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

        {formData.legalEntityType === "entity" && (
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
        {onBack ? (
          <Button
            type="button"
            variant="secondary"
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


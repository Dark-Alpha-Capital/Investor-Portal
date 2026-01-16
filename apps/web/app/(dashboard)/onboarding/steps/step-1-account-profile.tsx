"use client";

import type React from "react";
import { useState, useMemo, useCallback } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InvestorData } from "../onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Hoist static arrays outside component (rendering optimization 6.3, JS performance 7.1)
const CAPITAL_PROVIDER_TYPES = [
  "Family Office",
  "PE Fund",
  "Credit Fund",
  "Bank",
  "SBIC",
  "Other",
] as const;

const INVESTOR_TYPES = [
  "Individual investor including HNWI's",
  "Corporate Entities(LLC's, Corporations)",
  "Trusts and foundations",
  "Partnerships or LP's",
] as const;

type Step1AccountProfileProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack?: () => void;
};

const step1Schema = z.object({
  // KYC1: Legal Entity Type (driver field for conditional compliance logic)
  legalEntityType: z.enum(["individual", "entity"], {
    message: "Please select your investor classification",
  }),
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .trim(),
  primaryContactName: z
    .string()
    .min(1, "Primary contact name is required")
    .trim(),
  primaryContactTitle: z.string().optional().or(z.literal("")),
  primaryContactEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email")
    .trim(),
  primaryContactPhone: z
    .string()
    .min(1, "Phone is required")
    .trim(),
  capitalProviderType: z
    .string()
    .min(1, "Capital provider type is required"),
  investorType: z.string().min(1, "Investor type is required"),
  geographicFocus: z.string().optional().or(z.literal("")),
});

export function Step1AccountProfile({
  initialData,
  onSubmit,
  onBack,
}: Step1AccountProfileProps) {
  const [formData, setFormData] = useState<Partial<InvestorData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoize updateField callback (re-render optimization 5.5)
  const updateField = useCallback(
    (field: keyof InvestorData, value: string | "individual" | "entity") => {
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
      // Try to find the element with data-field attribute first (most reliable)
      let targetElement: HTMLElement | null = document.querySelector(
        `[data-field="${firstErrorKey}"]`
      ) as HTMLElement;

      // Fallback to ID
      if (!targetElement) {
        targetElement = document.getElementById(firstErrorKey) as HTMLElement;
      }

      // Fallback to name attribute
      if (!targetElement) {
        targetElement = document.querySelector(
          `[name="${firstErrorKey}"]`
        ) as HTMLElement;
      }

      // Fallback to error message element
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
        // Try to focus the element if it's focusable
        if (targetElement.focus) {
          targetElement.focus();
        }
      } else {
        // If no element found, scroll to top of form where errors might be
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const result = step1Schema.safeParse(formData);

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

        // Scroll to the first error element
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
          Account Type & Basic Profile
        </h2>
        <p className="text-muted-foreground text-sm">
          Please provide the information below to help us understand your
          investor profile and preferences.
        </p>
      </div>

      {/* KYC1: Legal Entity Type - Driver Field */}
      <div
        data-field="legalEntityType"
        className={cn(
          "space-y-4 p-4 rounded-lg border-2 transition-colors",
          errors.legalEntityType
            ? "border-destructive bg-destructive/5"
            : formData.legalEntityType
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/30 bg-muted/50"
        )}
      >
        <div>
          <h3 className="text-lg font-semibold">
            Investor Classification <span className="text-destructive">*</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please select one. This determines the compliance requirements for your onboarding.
          </p>
        </div>
        {errors.legalEntityType && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md border border-destructive">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm font-medium">
              {errors.legalEntityType}
            </p>
          </div>
        )}
        <RadioGroup
          value={formData.legalEntityType}
          onValueChange={(value) =>
            updateField("legalEntityType", value as "individual" | "entity")
          }
          className="space-y-3"
        >
          <div
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
              formData.legalEntityType === "individual"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
            onClick={() => updateField("legalEntityType", "individual")}
          >
            <RadioGroupItem value="individual" id="legal-entity-individual" className="mt-1" />
            <div className="space-y-1">
              <Label
                htmlFor="legal-entity-individual"
                className="font-medium cursor-pointer text-base"
              >
                Individual Investor
              </Label>
              <p className="text-sm text-muted-foreground">
                High Net Worth Individuals (HNWIs), personal accounts, or
                individual trusts where you are the sole beneficial owner.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
              formData.legalEntityType === "entity"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
            onClick={() => updateField("legalEntityType", "entity")}
          >
            <RadioGroupItem value="entity" id="legal-entity-entity" className="mt-1" />
            <div className="space-y-1">
              <Label
                htmlFor="legal-entity-entity"
                className="font-medium cursor-pointer text-base"
              >
                Entity Investor
              </Label>
              <p className="text-sm text-muted-foreground">
                Corporations, LLCs, Partnerships, Trusts with multiple
                beneficiaries, Foundations, or other legal entities. Additional
                UBO documentation required.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

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
            {CAPITAL_PROVIDER_TYPES.map((type) => (
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
            {INVESTOR_TYPES.map((type) => (
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


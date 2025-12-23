"use client";

import type React from "react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InvestorData } from "../onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";

type Step1AccountProfileProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack?: () => void;
};

const step1Schema = z.object({
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

  const updateField = (field: keyof InvestorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = step1Schema.safeParse(formData);

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
          Account Type & Basic Profile
        </h2>
        <p className="text-muted-foreground text-sm">
          Please provide the information below to help us understand your
          investor profile and preferences.
        </p>
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


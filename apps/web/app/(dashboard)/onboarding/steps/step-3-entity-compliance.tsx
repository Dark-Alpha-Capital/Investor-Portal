"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RepeatingGroup } from "../components/repeating-group";
import type {
  InvestorData,
  BeneficialOwnerData,
  AuthorizedSignatoryData,
} from "../onboarding-flow";
import { AlertCircle, ArrowRight, Info, Users, UserCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step3EntityComplianceProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack: () => void;
};

// Generate unique ID - hoist outside component (JS performance 7.1)
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default empty UBO - hoist outside component (rendering optimization 6.3)
const createEmptyUbo = (): BeneficialOwnerData => ({
  id: generateId(),
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  countryOfResidence: "",
  ownershipPercentage: 25,
  controlType: "direct",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  idDocumentType: "",
  isPep: false,
  pepDetails: "",
});

// Default empty signatory - hoist outside component (rendering optimization 6.3)
const createEmptySignatory = (): AuthorizedSignatoryData => ({
  id: generateId(),
  fullName: "",
  title: "",
  email: "",
  phone: "",
  authorizationScope: "full",
});

// Hoist static arrays outside component (rendering optimization 6.3, JS performance 7.1)
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Switzerland",
  "Singapore",
  "Hong Kong",
  "Australia",
  "Japan",
  "Other",
] as const;

const CONTROL_TYPES = [
  { value: "direct", label: "Direct Ownership" },
  { value: "indirect", label: "Indirect Ownership" },
  { value: "voting_rights", label: "Voting Rights" },
  { value: "other", label: "Other Control" },
] as const;

const ID_DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
] as const;

const AUTHORIZATION_SCOPES = [
  { value: "full", label: "Full Authorization" },
  { value: "limited", label: "Limited Authorization" },
  { value: "specific_transactions", label: "Specific Transactions Only" },
] as const;

export function Step3EntityCompliance({
  initialData,
  onSubmit,
  onBack,
}: Step3EntityComplianceProps) {
  const [beneficialOwners, setBeneficialOwners] = useState<
    BeneficialOwnerData[]
  >(initialData.beneficialOwners || [createEmptyUbo()]);

  const [authorizedSignatories, setAuthorizedSignatories] = useState<
    AuthorizedSignatoryData[]
  >(initialData.authorizedSignatories || [createEmptySignatory()]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // UBO handlers - memoize callbacks (re-render optimization 5.5)
  const handleAddUbo = useCallback(() => {
    setBeneficialOwners((prev) => [...prev, createEmptyUbo()]);
  }, []);

  const handleRemoveUbo = useCallback((index: number) => {
    setBeneficialOwners((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateUbo = useCallback(
    (index: number, ubo: BeneficialOwnerData) => {
      setBeneficialOwners((prev) =>
        prev.map((item, i) => (i === index ? ubo : item))
      );
    },
    []
  );

  // Signatory handlers - memoize callbacks (re-render optimization 5.5)
  const handleAddSignatory = useCallback(() => {
    setAuthorizedSignatories((prev) => [...prev, createEmptySignatory()]);
  }, []);

  const handleRemoveSignatory = useCallback((index: number) => {
    setAuthorizedSignatories((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateSignatory = useCallback(
    (index: number, signatory: AuthorizedSignatoryData) => {
      setAuthorizedSignatories((prev) =>
        prev.map((item, i) => (i === index ? signatory : item))
      );
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      // Validate at least one UBO with 25%+ ownership
      // Combine filter operations (JS performance 7.5)
      const beneficialOwnersLength = beneficialOwners.length;
      let hasValidUbo = false;
      for (let i = 0; i < beneficialOwnersLength; i++) {
        const ubo = beneficialOwners[i];
        // Validate UBO required fields inline (combine iterations 7.5)
        if (!ubo.fullName) {
          newErrors[`ubo_${i}_fullName`] = "Full name is required";
        }
        if (!ubo.nationality) {
          newErrors[`ubo_${i}_nationality`] = "Nationality is required";
        }
        if (ubo.ownershipPercentage < 25) {
          newErrors[`ubo_${i}_ownership`] =
            "Ownership must be 25% or greater";
        }
        // Check for valid UBO inline
        if (ubo.fullName && ubo.ownershipPercentage >= 25) {
          hasValidUbo = true;
        }
      }
      if (!hasValidUbo) {
        newErrors.ubos =
          "At least one beneficial owner with 25%+ ownership is required";
      }

      // Validate at least one signatory
      const authorizedSignatoriesLength = authorizedSignatories.length;
      if (authorizedSignatoriesLength === 0) {
        newErrors.signatories = "At least one authorized signatory is required";
      }

      // Validate signatory required fields
      for (let i = 0; i < authorizedSignatoriesLength; i++) {
        const sig = authorizedSignatories[i];
        if (!sig.fullName) {
          newErrors[`sig_${i}_fullName`] = "Full name is required";
        }
        if (!sig.title) {
          newErrors[`sig_${i}_title`] = "Title is required";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      onSubmit({
        ...initialData,
        beneficialOwners,
        authorizedSignatories,
      } as InvestorData);
    },
    [beneficialOwners, authorizedSignatories, initialData, onSubmit]
  );

  // Memoize render functions (re-render optimization 5.2)
  const renderUboItem = useCallback(
    (
      ubo: BeneficialOwnerData,
      index: number,
      onUpdate: (item: BeneficialOwnerData) => void
    ) => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Full Legal Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={ubo.fullName}
            onChange={(e) => onUpdate({ ...ubo, fullName: e.target.value })}
            placeholder="Enter full name"
            className={
              errors[`ubo_${index}_fullName`] ? "border-destructive" : ""
            }
          />
          {errors[`ubo_${index}_fullName`] && (
            <p className="text-destructive text-sm">
              {errors[`ubo_${index}_fullName`]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={ubo.dateOfBirth}
            onChange={(e) => onUpdate({ ...ubo, dateOfBirth: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Nationality <span className="text-destructive">*</span>
          </Label>
          <Select
            value={ubo.nationality}
            onValueChange={(value) => onUpdate({ ...ubo, nationality: value })}
          >
            <SelectTrigger
              className={
                errors[`ubo_${index}_nationality`] ? "border-destructive" : ""
              }
            >
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => {
                const countryLower = country.toLowerCase();
                return (
                  <SelectItem key={countryLower} value={countryLower}>
                    {country}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Country of Residence</Label>
          <Select
            value={ubo.countryOfResidence}
            onValueChange={(value) =>
              onUpdate({ ...ubo, countryOfResidence: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => {
                const countryLower = country.toLowerCase();
                return (
                  <SelectItem key={countryLower} value={countryLower}>
                    {country}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Ownership Percentage <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="25"
              max="100"
              value={ubo.ownershipPercentage}
              onChange={(e) =>
                onUpdate({
                  ...ubo,
                  ownershipPercentage: Number(e.target.value),
                })
              }
              className={
                errors[`ubo_${index}_ownership`] ? "border-destructive" : ""
              }
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum 25% ownership threshold
          </p>
        </div>
        <div className="space-y-2">
          <Label>Control Type</Label>
          <Select
            value={ubo.controlType}
            onValueChange={(value) => onUpdate({ ...ubo, controlType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CONTROL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>ID Document Type</Label>
        <Select
          value={ubo.idDocumentType}
          onValueChange={(value) =>
            onUpdate({ ...ubo, idDocumentType: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {ID_DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          You will upload the actual document in the KYC Documents step
        </p>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`ubo_${index}_pep`}
            checked={ubo.isPep}
            onCheckedChange={(checked) =>
              onUpdate({ ...ubo, isPep: Boolean(checked) })
            }
          />
          <div className="space-y-1">
            <Label htmlFor={`ubo_${index}_pep`} className="cursor-pointer">
              Politically Exposed Person (PEP)
            </Label>
            <p className="text-xs text-muted-foreground">
              Check if this person holds or has held a prominent public
              function, or is a close family member/associate of such a person.
            </p>
          </div>
        </div>
        {ubo.isPep && (
          <div className="mt-3 ml-7">
            <Label>PEP Details</Label>
            <Textarea
              value={ubo.pepDetails}
              onChange={(e) => onUpdate({ ...ubo, pepDetails: e.target.value })}
              placeholder="Please describe the nature of the PEP status..."
              className="mt-1"
            />
          </div>
        )}
      </div>
    </div>
  ),
    [errors]
  );

  const renderSignatoryItem = useCallback(
    (
    signatory: AuthorizedSignatoryData,
    index: number,
    onUpdate: (item: AuthorizedSignatoryData) => void
  ) => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={signatory.fullName}
            onChange={(e) =>
              onUpdate({ ...signatory, fullName: e.target.value })
            }
            placeholder="Enter full name"
            className={
              errors[`sig_${index}_fullName`] ? "border-destructive" : ""
            }
          />
        </div>
        <div className="space-y-2">
          <Label>
            Title / Position <span className="text-destructive">*</span>
          </Label>
          <Input
            value={signatory.title}
            onChange={(e) => onUpdate({ ...signatory, title: e.target.value })}
            placeholder="e.g., Managing Director, CEO"
            className={
              errors[`sig_${index}_title`] ? "border-destructive" : ""
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={signatory.email}
            onChange={(e) => onUpdate({ ...signatory, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            type="tel"
            value={signatory.phone}
            onChange={(e) => onUpdate({ ...signatory, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Authorization Scope</Label>
        <Select
          value={signatory.authorizationScope}
          onValueChange={(value) =>
            onUpdate({ ...signatory, authorizationScope: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select scope" />
          </SelectTrigger>
          <SelectContent>
            {AUTHORIZATION_SCOPES.map((scope) => (
              <SelectItem key={scope.value} value={scope.value}>
                {scope.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
    [errors]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Entity Compliance Information</h2>
        <p className="text-muted-foreground text-sm">
          As an entity investor, please provide details about beneficial owners
          and authorized signatories.
        </p>
      </div>

      {/* Beneficial Owners Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Beneficial Owners (UBOs)</h3>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Provide details for all individuals who directly or indirectly own
            <strong> 25% or more</strong> of the entity. This is required for
            regulatory compliance (AML/KYC).
          </AlertDescription>
        </Alert>
        {errors.ubos && (
          <p className="text-destructive text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.ubos}
          </p>
        )}
        <RepeatingGroup
          items={beneficialOwners}
          onAdd={handleAddUbo}
          onRemove={handleRemoveUbo}
          onUpdate={handleUpdateUbo}
          renderItem={renderUboItem}
          getItemTitle={(ubo, index) =>
            ubo.fullName || `Beneficial Owner ${index + 1}`
          }
          addButtonText="Add Beneficial Owner"
          minItems={1}
          maxItems={10}
          emptyMessage="Add at least one beneficial owner with 25%+ ownership"
        />
      </div>

      {/* Authorized Signatories Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Authorized Signatories</h3>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Provide details for individuals authorized to sign documents and
            make investment decisions on behalf of the entity.
          </AlertDescription>
        </Alert>
        {errors.signatories && (
          <p className="text-destructive text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.signatories}
          </p>
        )}
        <RepeatingGroup
          items={authorizedSignatories}
          onAdd={handleAddSignatory}
          onRemove={handleRemoveSignatory}
          onUpdate={handleUpdateSignatory}
          renderItem={renderSignatoryItem}
          getItemTitle={(sig, index) =>
            sig.fullName || `Authorized Signatory ${index + 1}`
          }
          addButtonText="Add Authorized Signatory"
          minItems={1}
          maxItems={5}
          emptyMessage="Add at least one authorized signatory"
        />
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

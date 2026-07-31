
import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { InvestorData } from "../-onboarding-flow";
import { AlertCircle, ArrowRight } from "lucide-react";

// Hoist static arrays (rendering optimization 6.3, JS performance 7.1)
const TIMING_OPTIONS = ["< 1 week", "1-2 weeks", "2-4 weeks", "> 4 weeks"] as const;
const ROLE_OPTIONS = [
  "Lead / majority control",
  "Co-control",
  "Significant minority with board seat",
  "Minority without board seat",
  "Flexible / situation-dependent",
] as const;
const SUPPORT_LETTER_OPTIONS = ["Yes", "No", "Possibly, case-by-case"] as const;
const BROKER_OPTIONS = ["Yes", "No", "Case-by-case"] as const;
const SUPPORT_LETTER_STAGES = [
  "After teaser, to obtain CIM",
  "After initial review of CIM",
  "With IOI / term sheet",
  "After management meeting",
  "After signing LOI",
  "After confirmatory diligence begins",
  "Only after diligence is substantially complete",
] as const;
const UPDATE_FREQUENCY_OPTIONS = ["Deal-by-deal only", "Monthly", "Quarterly"] as const;
const UPDATE_FORMAT_OPTIONS = [
  "Email summaries",
  "One-page deal briefs",
  "Group update calls",
  "1:1 calls as needed",
] as const;
const OWNERSHIP_OPTIONS = ["Majority", "Co-control", "Minority", "Flexible"] as const;
const TRANSACTION_TYPES = [
  "Control buyout / LBO",
  "Growth equity",
  "Minority recapitalization",
  "Co-investment alongside another sponsor",
  "Credit / debt-only",
] as const;
const ASSET_PROFILE_OPTIONS = [
  "Prefer asset-light businesses",
  "Comfortable with asset-heavy",
  "Either, case-by-case",
] as const;

type Step4InvestmentProfileProps = {
  initialData: Partial<InvestorData>;
  onSubmit: (data: InvestorData) => void;
  onBack?: () => void;
};

const step4Schema = z.object({
  // Process & timing
  timingToLOI: z
    .string()
    .min(1, "Please select timing to LOI"),
  timingToCommitment: z
    .string()
    .min(1, "Please select timing to commitment"),
  timingDrivers: z.string().optional().or(z.literal("")),
  // Economics
  economicsDescription: z
    .string()
    .min(1, "Please describe economics")
    .trim(),
  // Governance & control
  preferredRole: z
    .string()
    .min(1, "Please select preferred role"),
  governanceExpectations: z.string().optional().or(z.literal("")),
  // Support letters
  provideSupportLetter: z
    .string()
    .min(1, "Please select an option for support letters"),
  joinBrokerConversations: z
    .string()
    .min(1, "Please select an option for broker conversations"),
  supportLetterStages: z
    .array(z.string())
    .min(1, "Please select at least one stage"),
  // Communication preferences
  receiveUpdates: z
    .string()
    .min(1, "Please select if you want to receive updates"),
  updateFrequency: z.string().optional(),
  updateFormat: z.array(z.string()).optional(),
  industryPreferences: z.string().optional().or(z.literal("")),
  // Investment mandate – size & structure
  equityCheckSize: z
    .string()
    .min(1, "Please provide equity check size")
    .trim(),
  enterpriseValueRange: z.string().optional().or(z.literal("")),
  ebitdaRange: z.string().optional().or(z.literal("")),
  preferredOwnership: z
    .string()
    .min(1, "Please select preferred ownership"),
  typicalHoldPeriod: z.string().optional().or(z.literal("")),
  transactionTypes: z
    .array(z.string())
    .min(1, "Please select at least one transaction type"),
  leverageTolerance: z.string().optional().or(z.literal("")),
  // Company profile
  revenueCharacteristics: z
    .string()
    .min(1, "Please describe revenue characteristics"),
  customerConcentration: z.string().optional().or(z.literal("")),
  marginsAndCashFlow: z.string().optional().or(z.literal("")),
  assetProfile: z
    .string()
    .min(1, "Please select asset profile"),
  managementInvolvement: z.string().optional().or(z.literal("")),
  // Sectors & themes
  sectorsOfInterest: z
    .string()
    .min(1, "Please list sectors of interest"),
  sectorsToAvoid: z.string().optional().or(z.literal("")),
  dealSizeThresholds: z.string().optional().or(z.literal("")),
  specificThemes: z.string().optional().or(z.literal("")),
});

export function Step4InvestmentProfile({
  initialData,
  onSubmit,
  onBack,
}: Step4InvestmentProfileProps) {
  const [formData, setFormData] = useState<Partial<InvestorData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoize updateField callback (re-render optimization 5.5)
  const updateField = useCallback((field: keyof InvestorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      // Early exit if no error to clear (JS performance 7.7)
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Memoize toggleArrayField callback (re-render optimization 5.5)
  const toggleArrayField = useCallback(
    (field: keyof InvestorData, value: string) => {
      const currentValues = (formData[field] as string[]) || [];
      // Use Set for O(1) lookups (JS performance 7.11)
      const currentSet = new Set(currentValues);
      const newValues = currentSet.has(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      setFormData((prev) => ({ ...prev, [field]: newValues }));
      setErrors((prev) => {
        // Early exit if no error to clear (JS performance 7.7)
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [formData]
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
      const baseData = {
        ...formData,
        supportLetterStages: formData.supportLetterStages || [],
        transactionTypes: formData.transactionTypes || [],
        updateFormat: formData.updateFormat || [],
      };

      const result = step4Schema.safeParse(baseData);

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
          Investment Profile & Preferences
        </h2>
        <p className="text-muted-foreground text-sm">
          Please provide the information below to help us understand your
          investor profile and preferences.
        </p>
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
            {TIMING_OPTIONS.map((timing) => (
              <div key={timing} className="flex items-center space-x-2">
                <RadioGroupItem value={timing} id={`loi-${timing}`} />
                <Label
                  htmlFor={`loi-${timing}`}
                  className="font-normal cursor-pointer"
                >
                  {timing}
                </Label>
              </div>
            ))}
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
            {TIMING_OPTIONS.map((timing) => (
              <div key={timing} className="flex items-center space-x-2">
                <RadioGroupItem value={timing} id={`commitment-${timing}`} />
                <Label
                  htmlFor={`commitment-${timing}`}
                  className="font-normal cursor-pointer"
                >
                  {timing}
                </Label>
              </div>
            ))}
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
            {ROLE_OPTIONS.map((role) => {
              const roleValue = role
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/\//g, "");
              return (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={roleValue} id={role} />
                  <Label htmlFor={role} className="font-normal cursor-pointer">
                    {role}
                  </Label>
                </div>
              );
            })}
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
            {SUPPORT_LETTER_OPTIONS.map((option) => {
              const optionValue = option.toLowerCase().replace(/,\s+/g, "-");
              return (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={optionValue}
                    id={`support-${option}`}
                  />
                  <Label
                    htmlFor={`support-${option}`}
                    className="font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
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
            {BROKER_OPTIONS.map((option) => {
              const optionValue = option.toLowerCase().replace("-", "");
              return (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionValue} id={`broker-${option}`} />
                  <Label
                    htmlFor={`broker-${option}`}
                    className="font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
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
            {SUPPORT_LETTER_STAGES.map((stage) => {
              const isChecked = formData.supportLetterStages?.includes(stage) ?? false;
              return (
                <div key={stage} className="flex items-center space-x-2">
                  <Checkbox
                    id={stage}
                    checked={isChecked}
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
              );
            })}
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
                {UPDATE_FREQUENCY_OPTIONS.map((freq) => {
                  const freqValue = freq.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <div key={freq} className="flex items-center space-x-2">
                      <RadioGroupItem value={freqValue} id={freq} />
                      <Label
                        htmlFor={freq}
                        className="font-normal cursor-pointer"
                      >
                        {freq}
                      </Label>
                    </div>
                  );
                })}
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
                {UPDATE_FORMAT_OPTIONS.map((format) => {
                  const isChecked = formData.updateFormat?.includes(format) ?? false;
                  return (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format}
                        checked={isChecked}
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
                  );
                })}
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
            {OWNERSHIP_OPTIONS.map((ownership) => {
              const ownershipValue = ownership.toLowerCase();
              return (
                <div key={ownership} className="flex items-center space-x-2">
                  <RadioGroupItem value={ownershipValue} id={ownership} />
                  <Label
                    htmlFor={ownership}
                    className="font-normal cursor-pointer"
                  >
                    {ownership}
                  </Label>
                </div>
              );
            })}
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
            {TRANSACTION_TYPES.map((type) => {
              const isChecked = formData.transactionTypes?.includes(type) ?? false;
              return (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={isChecked}
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
              );
            })}
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
            {ASSET_PROFILE_OPTIONS.map((profile) => {
              const profileValue = profile
                .toLowerCase()
                .replace(/,\s+/g, "-")
                .replace(/\s+/g, "-");
              return (
                <div key={profile} className="flex items-center space-x-2">
                  <RadioGroupItem value={profileValue} id={profile} />
                  <Label htmlFor={profile} className="font-normal cursor-pointer">
                    {profile}
                  </Label>
                </div>
              );
            })}
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


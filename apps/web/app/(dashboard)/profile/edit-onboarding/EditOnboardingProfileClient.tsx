"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

type OnboardingData = {
  id: string;
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
  receiveUpdates: string;
  updateFrequency: string | null;
  industryPreferences: string | null;
  equityCheckSize: string;
  enterpriseValueRange: string | null;
  ebitdaRange: string | null;
  preferredOwnership: string;
  typicalHoldPeriod: string | null;
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
  legalEntityType: "individual" | "entity" | null;
  pepStatus: boolean | null;
  pepDetails: string | null;
  sourceOfWealthNarrative: string | null;
  lastEditedAt: Date | null;
  editCount: string | null;
  isEditable: boolean | null;
  submittedAt: Date | null;
  [key: string]: unknown;
};

type EditHistoryEntry = {
  id: string;
  fieldName: string;
  fieldLabel: string | null;
  previousValue: string | null;
  newValue: string | null;
  editedAt: Date;
};

type EditOnboardingProfileClientProps = {
  onboarding: OnboardingData;
  editHistory: EditHistoryEntry[];
};

export function EditOnboardingProfileClient({
  onboarding,
  editHistory,
}: EditOnboardingProfileClientProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (onboarding) {
      setFormData(onboarding);
    }
  }, [onboarding]);

  const updateMutation = useMutation(
    trpc.onboarding.updateOnboarding.mutationOptions({
      onSuccess: (result) => {
        toast.success(result.message);
        setHasChanges(false);
        queryClient.invalidateQueries({
          queryKey: ["onboarding", "getMyOnboarding"],
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update onboarding");
      },
    }),
  );

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!onboarding) return;

    const originalOnboarding = onboarding as Record<string, unknown>;

    const changedFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      const originalValue = originalOnboarding[key];
      if (value !== originalValue) {
        changedFields[key] = value;
      }
    }

    if (Object.keys(changedFields).length === 0) {
      toast.info("No changes to save");
      return;
    }

    updateMutation.mutate(
      changedFields as Parameters<(typeof updateMutation)["mutate"]>[0],
    );
  };

  const isEditable = onboarding.isEditable !== false;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/onboarding">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Onboarding
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Onboarding Information</h1>
            <p className="text-muted-foreground">
              Update your investor profile and KYC information
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Edit Status Alert */}
      {!isEditable && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Editing Disabled</AlertTitle>
          <AlertDescription>
            Your onboarding information can no longer be edited. Please contact
            support if you need to make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Last Edited Info */}
      {onboarding.lastEditedAt && (
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>
            Last edited:{" "}
            {format(new Date(onboarding.lastEditedAt), "MMM d, yyyy h:mm a")}
          </span>
          {onboarding.editCount && parseInt(onboarding.editCount) > 0 && (
            <Badge variant="secondary">{onboarding.editCount} edit(s)</Badge>
          )}
        </div>
      )}

      {/* Form Sections */}
      <Accordion
        type="multiple"
        defaultValue={["contact", "accreditation"]}
        className="space-y-4"
      >
        {/* Section 1: Contact Information */}
        <AccordionItem value="contact">
          <section>
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="p-0">
                <h3 className="text-lg">Contact Information</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName || ""}
                      onChange={(e) =>
                        handleInputChange("organizationName", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactName">
                      Primary Contact Name
                    </Label>
                    <Input
                      id="primaryContactName"
                      value={formData.primaryContactName || ""}
                      onChange={(e) =>
                        handleInputChange("primaryContactName", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactEmail">Email</Label>
                    <Input
                      id="primaryContactEmail"
                      type="email"
                      value={formData.primaryContactEmail || ""}
                      onChange={(e) =>
                        handleInputChange("primaryContactEmail", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactPhone">Phone</Label>
                    <Input
                      id="primaryContactPhone"
                      value={formData.primaryContactPhone || ""}
                      onChange={(e) =>
                        handleInputChange("primaryContactPhone", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactTitle">Title</Label>
                    <Input
                      id="primaryContactTitle"
                      value={formData.primaryContactTitle || ""}
                      onChange={(e) =>
                        handleInputChange("primaryContactTitle", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geographicFocus">Geographic Focus</Label>
                    <Input
                      id="geographicFocus"
                      value={formData.geographicFocus || ""}
                      onChange={(e) =>
                        handleInputChange("geographicFocus", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </section>
        </AccordionItem>

        {/* Section 2: Accreditation */}
        <AccordionItem value="accreditation">
          <section>
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="p-0">
                <h3 className="text-lg">
                  Accreditation & Status
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investorType">Investor Type</Label>
                    <Input
                      id="investorType"
                      value={formData.investorType || ""}
                      onChange={(e) =>
                        handleInputChange("investorType", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capitalProviderType">
                      Capital Provider Type
                    </Label>
                    <Input
                      id="capitalProviderType"
                      value={formData.capitalProviderType || ""}
                      onChange={(e) =>
                        handleInputChange("capitalProviderType", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accreditationStatus">
                      Accreditation Status
                    </Label>
                    <Input
                      id="accreditationStatus"
                      value={formData.accreditationStatus || ""}
                      onChange={(e) =>
                        handleInputChange("accreditationStatus", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accreditationMethod">
                      Accreditation Method
                    </Label>
                    <Input
                      id="accreditationMethod"
                      value={formData.accreditationMethod || ""}
                      onChange={(e) =>
                        handleInputChange("accreditationMethod", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </section>
        </AccordionItem>

        {/* Section 3: Investment Preferences */}
        <AccordionItem value="investment">
          <section>
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="p-0">
                <h3 className="text-lg">
                  Investment Preferences
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equityCheckSize">Equity Check Size</Label>
                    <Input
                      id="equityCheckSize"
                      value={formData.equityCheckSize || ""}
                      onChange={(e) =>
                        handleInputChange("equityCheckSize", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredOwnership">
                      Preferred Ownership
                    </Label>
                    <Input
                      id="preferredOwnership"
                      value={formData.preferredOwnership || ""}
                      onChange={(e) =>
                        handleInputChange("preferredOwnership", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="enterpriseValueRange">
                      Enterprise Value Range
                    </Label>
                    <Input
                      id="enterpriseValueRange"
                      value={formData.enterpriseValueRange || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "enterpriseValueRange",
                          e.target.value,
                        )
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ebitdaRange">EBITDA Range</Label>
                    <Input
                      id="ebitdaRange"
                      value={formData.ebitdaRange || ""}
                      onChange={(e) =>
                        handleInputChange("ebitdaRange", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectorsOfInterest">Sectors of Interest</Label>
                  <Textarea
                    id="sectorsOfInterest"
                    value={formData.sectorsOfInterest || ""}
                    onChange={(e) =>
                      handleInputChange("sectorsOfInterest", e.target.value)
                    }
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectorsToAvoid">Sectors to Avoid</Label>
                  <Textarea
                    id="sectorsToAvoid"
                    value={formData.sectorsToAvoid || ""}
                    onChange={(e) =>
                      handleInputChange("sectorsToAvoid", e.target.value)
                    }
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </AccordionContent>
          </section>
        </AccordionItem>

        {/* Section 4: Compliance */}
        <AccordionItem value="compliance">
          <section>
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="p-0">
                <h3 className="text-lg">
                  Compliance Information
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="legalEntityType">Legal Entity Type</Label>
                  <Select
                    value={formData.legalEntityType || ""}
                    onValueChange={(value) =>
                      handleInputChange("legalEntityType", value)
                    }
                    disabled={!isEditable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceOfWealthNarrative">
                    Source of Wealth
                  </Label>
                  <Textarea
                    id="sourceOfWealthNarrative"
                    value={formData.sourceOfWealthNarrative || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "sourceOfWealthNarrative",
                        e.target.value,
                      )
                    }
                    disabled={!isEditable}
                    placeholder="Describe how your wealth was acquired"
                  />
                </div>
              </div>
            </AccordionContent>
          </section>
        </AccordionItem>
      </Accordion>

      {/* Edit History */}
      {editHistory.length > 0 && (
        <section className="mt-8">
          <div>
            <h3 className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Edit History
            </h3>
            <p>
              Recent changes you&apos;ve made to your onboarding information
            </p>
          </div>
          <div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {editHistory.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {entry.fieldLabel || entry.fieldName}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <span className="line-through">
                        {entry.previousValue || "(empty)"}
                      </span>
                      {" → "}
                      <span className="text-foreground">
                        {entry.newValue || "(empty)"}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.editedAt), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Save Button (sticky footer) */}
      {hasChanges && isEditable && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
          <div className="container mx-auto max-w-4xl flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

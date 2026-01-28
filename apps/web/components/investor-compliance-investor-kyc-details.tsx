"use client";

import React from "react";
import { useMemo, Fragment } from "react";
import { format } from "date-fns";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Use flexible types that accept the actual database structure
type BeneficialOwner = {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  ownershipPercentage: number | string | null;
  residentialAddress?: string | null;
  address?: string | null;
  idDocumentType: string | null;
  idDocumentUrl: string | null;
  [key: string]: unknown;
};

type AuthorizedSignatory = {
  id: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  authorizationDocUrl: string | null;
  [key: string]: unknown;
};

type KycAttestation = {
  id: string;
  accuracyAttested?: boolean;
  accuracyAttestedAt?: Date | null;
  sanctionsDeclarationAttested?: boolean;
  sanctionsDeclarationAttestedAt?: Date | null;
  dataConsentAttested?: boolean;
  dataConsentAttestedAt?: Date | null;
  createdAt: Date;
  [key: string]: unknown;
};

type OnboardingDocument = {
  id: string;
  documentType: string;
  fileName: string | null;
  fileUrl: string | null;
  status: string | null;
  uploadedAt: Date | null;
  [key: string]: unknown;
};

// Flexible onboarding type that matches the actual database schema
type OnboardingData = {
  id: string;
  userId: string;

  // Compliance fields
  legalEntityType?: string | null;
  pepStatus?: boolean | null;
  pepDetails?: string | null;
  sourceOfWealthNarrative?: string | null;
  accuracyAttestation?: boolean | null;
  sanctionsDeclaration?: boolean | null;
  dataConsent?: boolean | null;

  // Section 1: Investor / Lender Details
  organizationName?: string | null;
  primaryContactName?: string | null;
  primaryContactTitle?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  capitalProviderType?: string | null;
  investorType?: string | null;
  geographicFocus?: string | null;

  // Step 2: Accreditation & Status
  accreditationStatus?: string | null;
  accreditationMethod?: string | null;
  entityTaxId?: string | null;
  entitySignatoryName?: string | null;
  entitySignatoryTitle?: string | null;

  // Section 2: Independent Sponsor Fit
  openToEmergingSponsor?: string | null;
  minimumRequirements?: string | null;
  priorDealAttribution?: string | null;
  priorDealAttributionExplanation?: string | null;

  // Section 3: NDAs & Confidentiality
  ndaPreference?: string | null;
  ndaLimitations?: string | null;

  // Section 4: Process & Timing
  timingToLOI?: string | null;
  timingToCommitment?: string | null;
  timingDrivers?: string | null;

  // Section 5: Economics
  economicsDescription?: string | null;

  // Section 6: Governance & Control
  preferredRole?: string | null;
  governanceExpectations?: string | null;

  // Section 7: Support Letters
  provideSupportLetter?: string | null;
  joinBrokerConversations?: string | null;
  supportLetterStages?: string[] | null;

  // Section 8: Communication Preferences
  receiveUpdates?: string | null;
  updateFrequency?: string | null;
  updateFormat?: string[] | null;
  industryPreferences?: string | null;

  // Section 9: Investment Mandate - Size & Structure
  equityCheckSize?: string | null;
  enterpriseValueRange?: string | null;
  ebitdaRange?: string | null;
  preferredOwnership?: string | null;
  typicalHoldPeriod?: string | null;
  transactionTypes?: string[] | null;
  leverageTolerance?: string | null;

  // Section 10: Investment Mandate - Company Profile
  revenueCharacteristics?: string | null;
  customerConcentration?: string | null;
  marginsAndCashFlow?: string | null;
  assetProfile?: string | null;
  managementInvolvement?: string | null;

  // Section 11: Sectors & Themes
  sectorsOfInterest?: string | null;
  sectorsToAvoid?: string | null;
  dealSizeThresholds?: string | null;
  specificThemes?: string | null;

  // Legal & E-Sign
  legalDocumentsAcknowledged?: boolean | null;
  electronicSignatureName?: string | null;
  electronicSignatureDate?: string | null;

  // Status
  status?: string | null;
  submittedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;

  // Related data
  beneficialOwners?: BeneficialOwner[];
  authorizedSignatories?: AuthorizedSignatory[];
  attestations?: KycAttestation[];
  documents?: OnboardingDocument[];

  [key: string]: unknown;
};

type InvestorKycDetailsProps = {
  onboarding: OnboardingData | null;
  userEmail: string;
  userName: string | null;
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
};

const getKycStatusBadge = (status: string | null | undefined) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    draft: { variant: "outline", label: "Draft" },
    pending: { variant: "secondary", label: "Pending" },
    submitted: { variant: "outline", label: "Submitted" },
    under_review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
    needs_more_info: { variant: "secondary", label: "Needs More Info" },
  };
  const config = statusConfig[status || "draft"] || statusConfig.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const DataTable = ({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: React.ReactNode }>;
}) => {
  const filteredData = data.filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== ""
  );
  if (filteredData.length === 0) return null;

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 px-3 py-2 border-b">
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="px-3 py-2 text-muted-foreground w-1/3 align-top">
                {item.label}
              </td>
              <td className="px-3 py-2 font-medium">{item.value || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function InvestorKycDetails({
  onboarding,
  userEmail,
  userName,
}: InvestorKycDetailsProps) {
  const isEntity = useMemo(
    () => onboarding?.legalEntityType === "entity",
    [onboarding?.legalEntityType]
  );

  if (!onboarding) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>This investor has not started the onboarding process yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h2 className="text-lg font-semibold">KYC Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEntity ? "Entity" : "Individual"} • Submitted{" "}
            {formatDate(onboarding.submittedAt)}
          </p>
        </div>
        {getKycStatusBadge(onboarding.status)}
      </div>

      {/* Investor Details */}
      <DataTable
        title="Investor Details"
        data={[
          { label: "Organization Name", value: onboarding.organizationName },
          {
            label: "Capital Provider Type",
            value: onboarding.capitalProviderType,
          },
          { label: "Investor Type", value: onboarding.investorType },
          { label: "Geographic Focus", value: onboarding.geographicFocus },
          {
            label: "Primary Contact Name",
            value: onboarding.primaryContactName,
          },
          {
            label: "Primary Contact Title",
            value: onboarding.primaryContactTitle,
          },
          {
            label: "Primary Contact Email",
            value: onboarding.primaryContactEmail,
          },
          {
            label: "Primary Contact Phone",
            value: onboarding.primaryContactPhone,
          },
        ]}
      />

      {/* Accreditation */}
      <DataTable
        title="Accreditation & Status"
        data={[
          {
            label: "Accreditation Status",
            value: onboarding.accreditationStatus,
          },
          {
            label: "Accreditation Method",
            value: onboarding.accreditationMethod,
          },
          ...(isEntity
            ? [
                { label: "Entity Tax ID", value: onboarding.entityTaxId },
                {
                  label: "Entity Signatory Name",
                  value: onboarding.entitySignatoryName,
                },
                {
                  label: "Entity Signatory Title",
                  value: onboarding.entitySignatoryTitle,
                },
              ]
            : []),
        ]}
      />

      {/* Sponsor Fit */}
      <DataTable
        title="Independent Sponsor Fit"
        data={[
          {
            label: "Open to Emerging Sponsor",
            value: onboarding.openToEmergingSponsor,
          },
          {
            label: "Prior Deal Attribution",
            value: onboarding.priorDealAttribution,
          },
          {
            label: "Minimum Requirements",
            value: onboarding.minimumRequirements ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.minimumRequirements}
              </div>
            ) : null,
          },
          {
            label: "Prior Deal Attribution Explanation",
            value: onboarding.priorDealAttributionExplanation ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.priorDealAttributionExplanation}
              </div>
            ) : null,
          },
        ]}
      />

      {/* NDAs & Confidentiality */}
      <DataTable
        title="NDAs & Confidentiality"
        data={[
          { label: "NDA Preference", value: onboarding.ndaPreference },
          {
            label: "NDA Limitations",
            value: onboarding.ndaLimitations ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.ndaLimitations}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Process & Timing */}
      <DataTable
        title="Process & Timing"
        data={[
          { label: "Timing to LOI", value: onboarding.timingToLOI },
          {
            label: "Timing to Commitment",
            value: onboarding.timingToCommitment,
          },
          {
            label: "Timing Drivers",
            value: onboarding.timingDrivers ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.timingDrivers}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Economics */}
      {onboarding.economicsDescription && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <h4 className="text-sm font-semibold">Economics</h4>
          </div>
          <div className="px-3 py-2 text-sm bg-muted/50">
            <p className="whitespace-pre-wrap">
              {onboarding.economicsDescription}
            </p>
          </div>
        </div>
      )}

      {/* Governance */}
      <DataTable
        title="Governance & Control"
        data={[
          { label: "Preferred Role", value: onboarding.preferredRole },
          {
            label: "Governance Expectations",
            value: onboarding.governanceExpectations ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.governanceExpectations}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Support Letters */}
      <DataTable
        title="Support Letters"
        data={[
          {
            label: "Provide Support Letter",
            value: onboarding.provideSupportLetter,
          },
          {
            label: "Join Broker Conversations",
            value: onboarding.joinBrokerConversations,
          },
          {
            label: "Support Letter Stages",
            value:
              onboarding.supportLetterStages &&
              onboarding.supportLetterStages.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {onboarding.supportLetterStages.map((stage, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {stage}
                    </Badge>
                  ))}
                </div>
              ) : null,
          },
        ]}
      />

      {/* Communication Preferences */}
      <DataTable
        title="Communication Preferences"
        data={[
          { label: "Receive Updates", value: onboarding.receiveUpdates },
          { label: "Update Frequency", value: onboarding.updateFrequency },
          {
            label: "Update Format",
            value:
              onboarding.updateFormat && onboarding.updateFormat.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {onboarding.updateFormat.map((format, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              ) : null,
          },
          {
            label: "Industry Preferences",
            value: onboarding.industryPreferences ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.industryPreferences}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Investment Mandate - Size & Structure */}
      <DataTable
        title="Investment Mandate - Size & Structure"
        data={[
          {
            label: "Equity Check Size",
            value: onboarding.equityCheckSize ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.equityCheckSize}
              </div>
            ) : null,
          },
          {
            label: "Enterprise Value Range",
            value: onboarding.enterpriseValueRange ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.enterpriseValueRange}
              </div>
            ) : null,
          },
          {
            label: "EBITDA Range",
            value: onboarding.ebitdaRange ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.ebitdaRange}
              </div>
            ) : null,
          },
          {
            label: "Preferred Ownership",
            value: onboarding.preferredOwnership,
          },
          {
            label: "Typical Hold Period",
            value: onboarding.typicalHoldPeriod ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.typicalHoldPeriod}
              </div>
            ) : null,
          },
          {
            label: "Transaction Types",
            value:
              onboarding.transactionTypes &&
              onboarding.transactionTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {onboarding.transactionTypes.map((type, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : null,
          },
          {
            label: "Leverage Tolerance",
            value: onboarding.leverageTolerance ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.leverageTolerance}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Investment Mandate - Company Profile */}
      <DataTable
        title="Investment Mandate - Company Profile"
        data={[
          {
            label: "Revenue Characteristics",
            value: onboarding.revenueCharacteristics ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.revenueCharacteristics}
              </div>
            ) : null,
          },
          {
            label: "Customer Concentration",
            value: onboarding.customerConcentration ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.customerConcentration}
              </div>
            ) : null,
          },
          {
            label: "Margins and Cash Flow",
            value: onboarding.marginsAndCashFlow ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.marginsAndCashFlow}
              </div>
            ) : null,
          },
          { label: "Asset Profile", value: onboarding.assetProfile },
          {
            label: "Management Involvement",
            value: onboarding.managementInvolvement ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.managementInvolvement}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Sectors & Themes */}
      <DataTable
        title="Sectors & Themes"
        data={[
          {
            label: "Sectors of Interest",
            value: onboarding.sectorsOfInterest ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.sectorsOfInterest}
              </div>
            ) : null,
          },
          {
            label: "Sectors to Avoid",
            value: onboarding.sectorsToAvoid ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.sectorsToAvoid}
              </div>
            ) : null,
          },
          {
            label: "Deal Size Thresholds",
            value: onboarding.dealSizeThresholds ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.dealSizeThresholds}
              </div>
            ) : null,
          },
          {
            label: "Specific Themes",
            value: onboarding.specificThemes ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.specificThemes}
              </div>
            ) : null,
          },
        ]}
      />

      {/* Compliance Declarations */}
      <DataTable
        title="Compliance Declarations"
        data={[
          {
            label: "PEP Status",
            value:
              onboarding.pepStatus === null ? (
                "Not declared"
              ) : onboarding.pepStatus ? (
                <Badge variant="destructive" className="text-xs">
                  Yes - PEP
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  No
                </Badge>
              ),
          },
          {
            label: "PEP Details",
            value:
              onboarding.pepStatus && onboarding.pepDetails ? (
                <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                  {onboarding.pepDetails}
                </div>
              ) : null,
          },
          {
            label: "Source of Wealth Narrative",
            value: onboarding.sourceOfWealthNarrative ? (
              <div className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap max-w-md">
                {onboarding.sourceOfWealthNarrative}
              </div>
            ) : null,
          },
          {
            label: "Sanctions Declaration",
            value: onboarding.sanctionsDeclaration ? (
              <Badge variant="default" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Not confirmed
              </Badge>
            ),
          },
          {
            label: "Data Consent",
            value: onboarding.dataConsent ? (
              <Badge variant="default" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Provided
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Not provided
              </Badge>
            ),
          },
          {
            label: "Accuracy Attestation",
            value: onboarding.accuracyAttestation ? (
              <Badge variant="default" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Attested
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Not attested
              </Badge>
            ),
          },
        ]}
      />

      {/* Legal & E-Signature */}
      <DataTable
        title="Legal & E-Signature"
        data={[
          {
            label: "Legal Documents Acknowledged",
            value: onboarding.legalDocumentsAcknowledged ? (
              <Badge variant="default" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Acknowledged
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Not acknowledged
              </Badge>
            ),
          },
          {
            label: "Electronic Signature Name",
            value: onboarding.electronicSignatureName,
          },
          {
            label: "Electronic Signature Date",
            value: onboarding.electronicSignatureDate,
          },
        ]}
      />

      {/* Beneficial Owners (Entity only) */}
      {isEntity &&
        onboarding.beneficialOwners &&
        onboarding.beneficialOwners.length > 0 && (
          <div className="space-y-2">
            <div className="bg-muted/50 px-3 py-2 border rounded-t-md">
              <h4 className="text-sm font-semibold">
                Beneficial Owners ({onboarding.beneficialOwners.length})
              </h4>
            </div>
            {onboarding.beneficialOwners.map((owner, index) => (
              <div key={owner.id} className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 px-3 py-1.5 border-b">
                  <h5 className="text-xs font-medium">
                    Owner {index + 1}: {owner.fullName}
                  </h5>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground w-1/3">
                        Date of Birth
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {owner.dateOfBirth || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        Nationality
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {owner.nationality || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        Ownership %
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {owner.ownershipPercentage
                          ? `${owner.ownershipPercentage}%`
                          : "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        Address
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {owner.address || owner.residentialAddress || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        ID Document Type
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {owner.idDocumentType || "N/A"}
                      </td>
                    </tr>
                    {owner.idDocumentUrl && (
                      <tr>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          ID Document
                        </td>
                        <td className="px-3 py-1.5">
                          <a
                            href={owner.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View Document
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

      {/* Authorized Signatories (Entity only) */}
      {isEntity &&
        onboarding.authorizedSignatories &&
        onboarding.authorizedSignatories.length > 0 && (
          <div className="space-y-2">
            <div className="bg-muted/50 px-3 py-2 border rounded-t-md">
              <h4 className="text-sm font-semibold">
                Authorized Signatories (
                {onboarding.authorizedSignatories.length})
              </h4>
            </div>
            {onboarding.authorizedSignatories.map((signatory, index) => (
              <div
                key={signatory.id}
                className="border rounded-md overflow-hidden"
              >
                <div className="bg-muted/30 px-3 py-1.5 border-b">
                  <h5 className="text-xs font-medium">
                    Signatory {index + 1}: {signatory.fullName}
                  </h5>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground w-1/3">
                        Title
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {signatory.title || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        Email
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {signatory.email || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 text-muted-foreground">
                        Phone
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {signatory.phone || "N/A"}
                      </td>
                    </tr>
                    {signatory.authorizationDocUrl && (
                      <tr>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          Authorization Document
                        </td>
                        <td className="px-3 py-1.5">
                          <a
                            href={signatory.authorizationDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View Document
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

      {/* Attestations */}
      {onboarding.attestations && onboarding.attestations.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <h4 className="text-sm font-semibold">KYC Attestations</h4>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {onboarding.attestations.map((attestation) => (
                <Fragment key={attestation.id}>
                  {attestation.accuracyAttested && (
                    <tr className="border-b">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="font-medium">
                            Accuracy Attestation
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-right">
                        {formatDate(attestation.accuracyAttestedAt ?? null)}
                      </td>
                    </tr>
                  )}
                  {attestation.sanctionsDeclarationAttested && (
                    <tr className="border-b">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="font-medium">
                            Sanctions Declaration
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-right">
                        {formatDate(
                          attestation.sanctionsDeclarationAttestedAt ?? null
                        )}
                      </td>
                    </tr>
                  )}
                  {attestation.dataConsentAttested && (
                    <tr className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="font-medium">
                            Data Processing Consent
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-right">
                        {formatDate(attestation.dataConsentAttestedAt ?? null)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents */}
      {onboarding.documents && onboarding.documents.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <h4 className="text-sm font-semibold">
              Uploaded Documents ({onboarding.documents.length})
            </h4>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {onboarding.documents.map((doc, idx) => (
                <tr key={doc.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs">
                          {doc.documentType?.replace(/_/g, " ") || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName || "Unnamed file"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant={
                          doc.status === "approved"
                            ? "default"
                            : doc.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {doc.status || "pending"}
                      </Badge>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

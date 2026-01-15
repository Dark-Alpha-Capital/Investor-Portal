"use client";

import { useMemo, memo } from "react";
import { format } from "date-fns";
import {
  User,
  Building,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Users,
  PenTool,
  Shield,
  DollarSign,
  Briefcase,
  Clock,
  Handshake,
  MessageSquare,
  Target,
  TrendingUp,
  MapPin,
  FileCheck,
} from "lucide-react";
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

const Section = memo(function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <div className="pl-6 space-y-3">{children}</div>
    </div>
  );
});

const Field = memo(function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium text-foreground">
        {value || "N/A"}
      </span>
    </div>
  );
});

const TextAreaField = memo(function TextAreaField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="space-y-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap border">
        {value}
      </p>
    </div>
  );
});

const ArrayField = memo(function ArrayField({
  label,
  values,
}: {
  label: string;
  values: string[] | null | undefined;
}) {
  if (!values || values.length === 0) return null;
  return (
    <div className="space-y-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value, idx) => (
          <Badge key={idx} variant="outline">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
});

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">KYC Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEntity ? "Entity" : "Individual"} Investor • Submitted{" "}
            {formatDate(onboarding.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getKycStatusBadge(onboarding.status)}
        </div>
      </div>

      {/* Section 1: Investor / Lender Details */}
      <div className="space-y-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Investor / Lender Details</h3>
        <Section title="Organization Information" icon={Building}>
          <Field
            label="Organization Name"
            value={onboarding.organizationName}
          />
          <Field
            label="Capital Provider Type"
            value={onboarding.capitalProviderType}
          />
          <Field label="Investor Type" value={onboarding.investorType} />
          <Field label="Geographic Focus" value={onboarding.geographicFocus} />
        </Section>

        <div className="border-t my-4" />

        <Section title="Primary Contact" icon={User}>
          <Field label="Name" value={onboarding.primaryContactName} />
          <Field label="Title" value={onboarding.primaryContactTitle} />
          <Field label="Email" value={onboarding.primaryContactEmail} />
          <Field label="Phone" value={onboarding.primaryContactPhone} />
        </Section>
      </div>

      {/* Accreditation & Status */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Accreditation & Status</h3>
        <Section title="Accreditation Details" icon={Shield}>
          <Field
            label="Accreditation Status"
            value={onboarding.accreditationStatus}
          />
          <Field
            label="Accreditation Method"
            value={onboarding.accreditationMethod}
          />
          {isEntity && (
            <>
              <Field label="Entity Tax ID" value={onboarding.entityTaxId} />
              <Field
                label="Entity Signatory Name"
                value={onboarding.entitySignatoryName}
              />
              <Field
                label="Entity Signatory Title"
                value={onboarding.entitySignatoryTitle}
              />
            </>
          )}
        </Section>
      </div>

      {/* Section 2: Independent Sponsor Fit */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Independent Sponsor Fit</h3>
        <Section title="Sponsor Preferences" icon={Handshake}>
          <Field
            label="Open to Emerging Sponsor"
            value={onboarding.openToEmergingSponsor}
          />
          <TextAreaField
            label="Minimum Requirements"
            value={onboarding.minimumRequirements}
          />
          <Field
            label="Prior Deal Attribution"
            value={onboarding.priorDealAttribution}
          />
          <TextAreaField
            label="Prior Deal Attribution Explanation"
            value={onboarding.priorDealAttributionExplanation}
          />
        </Section>
      </div>

      {/* Section 3: NDAs & Confidentiality */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">NDAs & Confidentiality</h3>
        <Section title="NDA Preferences" icon={FileText}>
          <Field label="NDA Preference" value={onboarding.ndaPreference} />
          <TextAreaField
            label="NDA Limitations"
            value={onboarding.ndaLimitations}
          />
        </Section>
      </div>

      {/* Section 4: Process & Timing */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Process & Timing</h3>
        <Section title="Timing Expectations" icon={Clock}>
          <Field label="Timing to LOI" value={onboarding.timingToLOI} />
          <Field
            label="Timing to Commitment"
            value={onboarding.timingToCommitment}
          />
          <TextAreaField
            label="Timing Drivers"
            value={onboarding.timingDrivers}
          />
        </Section>
      </div>

      {/* Section 5: Economics */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Economics</h3>
        <Section title="Economics Description" icon={DollarSign}>
          <TextAreaField
            label="Economics Description"
            value={onboarding.economicsDescription}
          />
        </Section>
      </div>

      {/* Section 6: Governance & Control */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Governance & Control</h3>
        <Section title="Governance Preferences" icon={Shield}>
          <Field label="Preferred Role" value={onboarding.preferredRole} />
          <TextAreaField
            label="Governance Expectations"
            value={onboarding.governanceExpectations}
          />
        </Section>
      </div>

      {/* Section 7: Support Letters */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Support Letters</h3>
        <Section title="Support Letter Preferences" icon={FileCheck}>
          <Field
            label="Provide Support Letter"
            value={onboarding.provideSupportLetter}
          />
          <Field
            label="Join Broker Conversations"
            value={onboarding.joinBrokerConversations}
          />
          <ArrayField
            label="Support Letter Stages"
            values={onboarding.supportLetterStages || null}
          />
        </Section>
      </div>

      {/* Section 8: Communication Preferences */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Communication Preferences</h3>
        <Section title="Update Preferences" icon={MessageSquare}>
          <Field label="Receive Updates" value={onboarding.receiveUpdates} />
          <Field label="Update Frequency" value={onboarding.updateFrequency} />
          <ArrayField
            label="Update Format"
            values={onboarding.updateFormat || null}
          />
          <TextAreaField
            label="Industry Preferences"
            value={onboarding.industryPreferences}
          />
        </Section>
      </div>

      {/* Section 9: Investment Mandate - Size & Structure */}
      <div className="space-y-6 py-4 border-b">
        <h3 className="text-lg font-semibold">
          Investment Mandate - Size & Structure
        </h3>
        <Section title="Investment Size" icon={DollarSign}>
          <TextAreaField
            label="Equity Check Size"
            value={onboarding.equityCheckSize}
          />
          <TextAreaField
            label="Enterprise Value Range"
            value={onboarding.enterpriseValueRange}
          />
          <TextAreaField label="EBITDA Range" value={onboarding.ebitdaRange} />
        </Section>

        <div className="border-t my-4" />

        <Section title="Investment Structure" icon={Briefcase}>
          <Field
            label="Preferred Ownership"
            value={onboarding.preferredOwnership}
          />
          <TextAreaField
            label="Typical Hold Period"
            value={onboarding.typicalHoldPeriod}
          />
          <ArrayField
            label="Transaction Types"
            values={onboarding.transactionTypes || null}
          />
          <TextAreaField
            label="Leverage Tolerance"
            value={onboarding.leverageTolerance}
          />
        </Section>
      </div>

      {/* Section 10: Investment Mandate - Company Profile */}
      <div className="space-y-6 py-4 border-b">
        <h3 className="text-lg font-semibold">
          Investment Mandate - Company Profile
        </h3>
        <Section title="Financial Characteristics" icon={TrendingUp}>
          <TextAreaField
            label="Revenue Characteristics"
            value={onboarding.revenueCharacteristics}
          />
          <TextAreaField
            label="Customer Concentration"
            value={onboarding.customerConcentration}
          />
          <TextAreaField
            label="Margins and Cash Flow"
            value={onboarding.marginsAndCashFlow}
          />
        </Section>

        <div className="border-t my-4" />

        <Section title="Business Profile" icon={Target}>
          <Field label="Asset Profile" value={onboarding.assetProfile} />
          <TextAreaField
            label="Management Involvement"
            value={onboarding.managementInvolvement}
          />
        </Section>
      </div>

      {/* Section 11: Sectors & Themes */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Sectors & Themes</h3>
        <Section title="Sector Preferences" icon={MapPin}>
          <TextAreaField
            label="Sectors of Interest"
            value={onboarding.sectorsOfInterest}
          />
          <TextAreaField
            label="Sectors to Avoid"
            value={onboarding.sectorsToAvoid}
          />
          <TextAreaField
            label="Deal Size Thresholds"
            value={onboarding.dealSizeThresholds}
          />
          <TextAreaField
            label="Specific Themes"
            value={onboarding.specificThemes}
          />
        </Section>
      </div>

      {/* Compliance Declarations */}
      <div className="space-y-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Compliance Declarations</h3>
        <Section title="PEP Status" icon={Shield}>
          <Field
            label="Is PEP"
            value={
              onboarding.pepStatus === null ? (
                "Not declared"
              ) : onboarding.pepStatus ? (
                <Badge variant="destructive">Yes - PEP</Badge>
              ) : (
                <Badge variant="outline">No</Badge>
              )
            }
          />
          {onboarding.pepStatus && onboarding.pepDetails && (
            <TextAreaField label="PEP Details" value={onboarding.pepDetails} />
          )}
        </Section>

        <div className="border-t my-4" />

        <Section title="Source of Wealth" icon={DollarSign}>
          <TextAreaField
            label="Source of Wealth Narrative"
            value={onboarding.sourceOfWealthNarrative}
          />
        </Section>

        <div className="border-t my-4" />

        <Section title="Declarations" icon={CheckCircle2}>
          <Field
            label="Sanctions Declaration"
            value={
              onboarding.sanctionsDeclaration ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Confirmed
                </Badge>
              ) : (
                <Badge variant="outline">Not confirmed</Badge>
              )
            }
          />
          <Field
            label="Data Consent"
            value={
              onboarding.dataConsent ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Provided
                </Badge>
              ) : (
                <Badge variant="outline">Not provided</Badge>
              )
            }
          />
          <Field
            label="Accuracy Attestation"
            value={
              onboarding.accuracyAttestation ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Attested
                </Badge>
              ) : (
                <Badge variant="outline">Not attested</Badge>
              )
            }
          />
        </Section>
      </div>

      {/* Legal & E-Signature */}
      <div className="space-y-4 py-4 border-b">
        <h3 className="text-lg font-semibold">Legal & E-Signature</h3>
        <Section title="Legal Documents" icon={FileCheck}>
          <Field
            label="Legal Documents Acknowledged"
            value={
              onboarding.legalDocumentsAcknowledged ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Acknowledged
                </Badge>
              ) : (
                <Badge variant="outline">Not acknowledged</Badge>
              )
            }
          />
          <Field
            label="Electronic Signature Name"
            value={onboarding.electronicSignatureName}
          />
          <Field
            label="Electronic Signature Date"
            value={onboarding.electronicSignatureDate}
          />
        </Section>
      </div>

      {/* Beneficial Owners (Entity only) */}
      {isEntity &&
        onboarding.beneficialOwners &&
        onboarding.beneficialOwners.length > 0 && (
          <div className="space-y-4 py-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Beneficial Owners</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {onboarding.beneficialOwners.length} beneficial owner(s)
                registered
              </p>
            </div>
            <div className="space-y-6">
              {onboarding.beneficialOwners.map((owner, index) => (
                <div
                  key={owner.id}
                  className="border rounded-md p-4 bg-muted/30"
                >
                  <Section
                    title={`Owner ${index + 1}: ${owner.fullName}`}
                    icon={Users}
                  >
                    <Field label="Date of Birth" value={owner.dateOfBirth} />
                    <Field label="Nationality" value={owner.nationality} />
                    <Field
                      label="Ownership %"
                      value={
                        owner.ownershipPercentage
                          ? `${owner.ownershipPercentage}%`
                          : null
                      }
                    />
                    <Field
                      label="Address"
                      value={owner.address || owner.residentialAddress}
                    />
                    <Field
                      label="ID Document Type"
                      value={owner.idDocumentType}
                    />
                    {owner.idDocumentUrl && (
                      <Field
                        label="ID Document"
                        value={
                          <a
                            href={owner.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        }
                      />
                    )}
                  </Section>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Authorized Signatories (Entity only) */}
      {isEntity &&
        onboarding.authorizedSignatories &&
        onboarding.authorizedSignatories.length > 0 && (
          <div className="space-y-4 py-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Authorized Signatories</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {onboarding.authorizedSignatories.length} authorized
                signatory(ies) registered
              </p>
            </div>
            <div className="space-y-6">
              {onboarding.authorizedSignatories.map((signatory, index) => (
                <div
                  key={signatory.id}
                  className="border rounded-md p-4 bg-muted/30"
                >
                  <Section
                    title={`Signatory ${index + 1}: ${signatory.fullName}`}
                    icon={PenTool}
                  >
                    <Field label="Title" value={signatory.title} />
                    <Field label="Email" value={signatory.email} />
                    <Field label="Phone" value={signatory.phone} />
                    {signatory.authorizationDocUrl && (
                      <Field
                        label="Authorization Document"
                        value={
                          <a
                            href={signatory.authorizationDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        }
                      />
                    )}
                  </Section>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Attestations */}
      {onboarding.attestations && onboarding.attestations.length > 0 && (
        <div className="space-y-4 py-4 border-b">
          <h3 className="text-lg font-semibold">KYC Attestations</h3>
          <div className="space-y-2">
            {onboarding.attestations.map((attestation) => (
              <div
                key={attestation.id}
                className="space-y-2 py-2 border-b last:border-0"
              >
                {attestation.accuracyAttested && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Accuracy Attestation
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(attestation.accuracyAttestedAt ?? null)}
                    </span>
                  </div>
                )}
                {attestation.sanctionsDeclarationAttested && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Sanctions Declaration
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(
                        attestation.sanctionsDeclarationAttestedAt ?? null
                      )}
                    </span>
                  </div>
                )}
                {attestation.dataConsentAttested && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Data Processing Consent
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(attestation.dataConsentAttestedAt ?? null)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {onboarding.documents && onboarding.documents.length > 0 && (
        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-lg font-semibold">Uploaded Documents</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {onboarding.documents.length} document(s) uploaded
            </p>
          </div>
          <div className="space-y-2">
            {onboarding.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {doc.documentType?.replace(/_/g, " ") || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileName || "Unnamed file"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      doc.status === "approved"
                        ? "default"
                        : doc.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {doc.status || "pending"}
                  </Badge>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

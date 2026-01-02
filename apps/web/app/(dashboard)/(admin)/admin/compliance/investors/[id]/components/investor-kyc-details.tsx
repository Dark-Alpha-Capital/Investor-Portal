"use client";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
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

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value || "N/A"}</span>
    </div>
  );
}

function TextAreaField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-2 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ArrayField({ label, values }: { label: string; values: string[] | null | undefined }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="space-y-2 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value, idx) => (
          <Badge key={idx} variant="outline">{value}</Badge>
        ))}
      </div>
    </div>
  );
}

export function InvestorKycDetails({ onboarding, userEmail, userName }: InvestorKycDetailsProps) {
  if (!onboarding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Information</CardTitle>
          <CardDescription>No onboarding data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>This investor has not started the onboarding process yet.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEntity = onboarding.legalEntityType === "entity";

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KYC Information</CardTitle>
              <CardDescription>
                {isEntity ? "Entity" : "Individual"} Investor • Submitted {formatDate(onboarding.submittedAt)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getKycStatusBadge(onboarding.status)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section 1: Investor / Lender Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investor / Lender Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Organization Information" icon={Building}>
            <Field label="Organization Name" value={onboarding.organizationName} />
            <Field label="Capital Provider Type" value={onboarding.capitalProviderType} />
            <Field label="Investor Type" value={onboarding.investorType} />
            <Field label="Geographic Focus" value={onboarding.geographicFocus} />
          </Section>
          
          <Separator />
          
          <Section title="Primary Contact" icon={User}>
            <Field label="Name" value={onboarding.primaryContactName} />
            <Field label="Title" value={onboarding.primaryContactTitle} />
            <Field label="Email" value={onboarding.primaryContactEmail} />
            <Field label="Phone" value={onboarding.primaryContactPhone} />
          </Section>
        </CardContent>
      </Card>

      {/* Accreditation & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accreditation & Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Accreditation Details" icon={Shield}>
            <Field label="Accreditation Status" value={onboarding.accreditationStatus} />
            <Field label="Accreditation Method" value={onboarding.accreditationMethod} />
            {isEntity && (
              <>
                <Field label="Entity Tax ID" value={onboarding.entityTaxId} />
                <Field label="Entity Signatory Name" value={onboarding.entitySignatoryName} />
                <Field label="Entity Signatory Title" value={onboarding.entitySignatoryTitle} />
              </>
            )}
          </Section>
        </CardContent>
      </Card>

      {/* Section 2: Independent Sponsor Fit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Independent Sponsor Fit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Sponsor Preferences" icon={Handshake}>
            <Field label="Open to Emerging Sponsor" value={onboarding.openToEmergingSponsor} />
            <TextAreaField label="Minimum Requirements" value={onboarding.minimumRequirements} />
            <Field label="Prior Deal Attribution" value={onboarding.priorDealAttribution} />
            <TextAreaField label="Prior Deal Attribution Explanation" value={onboarding.priorDealAttributionExplanation} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 3: NDAs & Confidentiality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NDAs & Confidentiality</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="NDA Preferences" icon={FileText}>
            <Field label="NDA Preference" value={onboarding.ndaPreference} />
            <TextAreaField label="NDA Limitations" value={onboarding.ndaLimitations} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 4: Process & Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Process & Timing</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Timing Expectations" icon={Clock}>
            <Field label="Timing to LOI" value={onboarding.timingToLOI} />
            <Field label="Timing to Commitment" value={onboarding.timingToCommitment} />
            <TextAreaField label="Timing Drivers" value={onboarding.timingDrivers} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 5: Economics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Economics</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Economics Description" icon={DollarSign}>
            <TextAreaField label="Economics Description" value={onboarding.economicsDescription} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 6: Governance & Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Governance & Control</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Governance Preferences" icon={Shield}>
            <Field label="Preferred Role" value={onboarding.preferredRole} />
            <TextAreaField label="Governance Expectations" value={onboarding.governanceExpectations} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 7: Support Letters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support Letters</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Support Letter Preferences" icon={FileCheck}>
            <Field label="Provide Support Letter" value={onboarding.provideSupportLetter} />
            <Field label="Join Broker Conversations" value={onboarding.joinBrokerConversations} />
            <ArrayField label="Support Letter Stages" values={onboarding.supportLetterStages || null} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 8: Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communication Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Update Preferences" icon={MessageSquare}>
            <Field label="Receive Updates" value={onboarding.receiveUpdates} />
            <Field label="Update Frequency" value={onboarding.updateFrequency} />
            <ArrayField label="Update Format" values={onboarding.updateFormat || null} />
            <TextAreaField label="Industry Preferences" value={onboarding.industryPreferences} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 9: Investment Mandate - Size & Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investment Mandate - Size & Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Investment Size" icon={DollarSign}>
            <TextAreaField label="Equity Check Size" value={onboarding.equityCheckSize} />
            <TextAreaField label="Enterprise Value Range" value={onboarding.enterpriseValueRange} />
            <TextAreaField label="EBITDA Range" value={onboarding.ebitdaRange} />
          </Section>
          
          <Separator />
          
          <Section title="Investment Structure" icon={Briefcase}>
            <Field label="Preferred Ownership" value={onboarding.preferredOwnership} />
            <TextAreaField label="Typical Hold Period" value={onboarding.typicalHoldPeriod} />
            <ArrayField label="Transaction Types" values={onboarding.transactionTypes || null} />
            <TextAreaField label="Leverage Tolerance" value={onboarding.leverageTolerance} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 10: Investment Mandate - Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investment Mandate - Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Financial Characteristics" icon={TrendingUp}>
            <TextAreaField label="Revenue Characteristics" value={onboarding.revenueCharacteristics} />
            <TextAreaField label="Customer Concentration" value={onboarding.customerConcentration} />
            <TextAreaField label="Margins and Cash Flow" value={onboarding.marginsAndCashFlow} />
          </Section>
          
          <Separator />
          
          <Section title="Business Profile" icon={Target}>
            <Field label="Asset Profile" value={onboarding.assetProfile} />
            <TextAreaField label="Management Involvement" value={onboarding.managementInvolvement} />
          </Section>
        </CardContent>
      </Card>

      {/* Section 11: Sectors & Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sectors & Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <Section title="Sector Preferences" icon={MapPin}>
            <TextAreaField label="Sectors of Interest" value={onboarding.sectorsOfInterest} />
            <TextAreaField label="Sectors to Avoid" value={onboarding.sectorsToAvoid} />
            <TextAreaField label="Deal Size Thresholds" value={onboarding.dealSizeThresholds} />
            <TextAreaField label="Specific Themes" value={onboarding.specificThemes} />
          </Section>
        </CardContent>
      </Card>

      {/* Compliance Declarations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Declarations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="PEP Status" icon={Shield}>
            <Field
              label="Is PEP"
              value={
                onboarding.pepStatus === null ? "Not declared" : onboarding.pepStatus ? (
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
          
          <Separator />
          
          <Section title="Source of Wealth" icon={DollarSign}>
            <TextAreaField label="Source of Wealth Narrative" value={onboarding.sourceOfWealthNarrative} />
          </Section>
          
          <Separator />
          
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
        </CardContent>
      </Card>

      {/* Legal & E-Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legal & E-Signature</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Field label="Electronic Signature Name" value={onboarding.electronicSignatureName} />
            <Field label="Electronic Signature Date" value={onboarding.electronicSignatureDate} />
          </Section>
        </CardContent>
      </Card>

      {/* Beneficial Owners (Entity only) */}
      {isEntity && onboarding.beneficialOwners && onboarding.beneficialOwners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Beneficial Owners</CardTitle>
            <CardDescription>{onboarding.beneficialOwners.length} beneficial owner(s) registered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboarding.beneficialOwners.map((owner, index) => (
              <div key={owner.id} className="border rounded-lg p-4">
                <Section title={`Owner ${index + 1}: ${owner.fullName}`} icon={Users}>
                  <Field label="Date of Birth" value={owner.dateOfBirth} />
                  <Field label="Nationality" value={owner.nationality} />
                  <Field label="Ownership %" value={owner.ownershipPercentage ? `${owner.ownershipPercentage}%` : null} />
                  <Field label="Address" value={owner.address || owner.residentialAddress} />
                  <Field label="ID Document Type" value={owner.idDocumentType} />
                  {owner.idDocumentUrl && (
                    <Field
                      label="ID Document"
                      value={
                        <a href={owner.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Document
                        </a>
                      }
                    />
                  )}
                </Section>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Authorized Signatories (Entity only) */}
      {isEntity && onboarding.authorizedSignatories && onboarding.authorizedSignatories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authorized Signatories</CardTitle>
            <CardDescription>{onboarding.authorizedSignatories.length} authorized signatory(ies) registered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboarding.authorizedSignatories.map((signatory, index) => (
              <div key={signatory.id} className="border rounded-lg p-4">
                <Section title={`Signatory ${index + 1}: ${signatory.fullName}`} icon={PenTool}>
                  <Field label="Title" value={signatory.title} />
                  <Field label="Email" value={signatory.email} />
                  <Field label="Phone" value={signatory.phone} />
                  {signatory.authorizationDocUrl && (
                    <Field
                      label="Authorization Document"
                      value={
                        <a href={signatory.authorizationDocUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Document
                        </a>
                      }
                    />
                  )}
                </Section>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attestations */}
      {onboarding.attestations && onboarding.attestations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KYC Attestations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onboarding.attestations.map((attestation) => (
                <div key={attestation.id} className="space-y-2 py-2 border-b last:border-0">
                  {attestation.accuracyAttested && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Accuracy Attestation</span>
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
                        <span className="text-sm font-medium">Sanctions Declaration</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(attestation.sanctionsDeclarationAttestedAt ?? null)}
                      </span>
                    </div>
                  )}
                  {attestation.dataConsentAttested && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Data Processing Consent</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(attestation.dataConsentAttestedAt ?? null)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {onboarding.documents && onboarding.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            <CardDescription>{onboarding.documents.length} document(s) uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onboarding.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.documentType?.replace(/_/g, " ") || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{doc.fileName || "Unnamed file"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                      {doc.status || "pending"}
                    </Badge>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

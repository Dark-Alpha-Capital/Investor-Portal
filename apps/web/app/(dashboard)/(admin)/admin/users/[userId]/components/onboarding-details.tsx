import {
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OnboardingDetailsProps {
  onboarding: {
    organizationName: string;
    primaryContactName: string;
    primaryContactTitle: string | null;
    primaryContactEmail: string;
    primaryContactPhone: string;
    capitalProviderType: string;
    investorType: string;
    geographicFocus: string | null;
    equityCheckSize: string;
    enterpriseValueRange: string | null;
    ebitdaRange: string | null;
    preferredOwnership: string;
    typicalHoldPeriod: string | null;
    leverageTolerance: string | null;
    transactionTypes: string[] | null;
    revenueCharacteristics: string;
    customerConcentration: string | null;
    marginsAndCashFlow: string | null;
    assetProfile: string;
    managementInvolvement: string | null;
    sectorsOfInterest: string;
    sectorsToAvoid: string | null;
    specificThemes: string | null;
    openToEmergingSponsor: string | null;
    economicsDescription: string | null;
    governanceExpectations: string | null;
  };
}

export function OnboardingDetails({ onboarding }: OnboardingDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Investor / Lender Details */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Investor / Lender Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Organization</p>
            <p className="font-medium">{onboarding.organizationName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Primary Contact
            </p>
            <p className="font-medium">{onboarding.primaryContactName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Contact Title</p>
            <p className="font-medium">
              {onboarding.primaryContactTitle || "N/A"}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="font-medium truncate">
                {onboarding.primaryContactEmail}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">{onboarding.primaryContactPhone}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Capital Provider Type
            </p>
            <p className="font-medium">{onboarding.capitalProviderType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Investor Type</p>
            <p className="font-medium">{onboarding.investorType}</p>
          </div>
          {onboarding.geographicFocus && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Geographic Focus
                </p>
                <p className="font-medium">{onboarding.geographicFocus}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Investment Mandate */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Investment Mandate</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Equity Check Size
            </p>
            <p className="font-medium">{onboarding.equityCheckSize}</p>
          </div>
          {onboarding.enterpriseValueRange && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Enterprise Value Range
              </p>
              <p className="font-medium">{onboarding.enterpriseValueRange}</p>
            </div>
          )}
          {onboarding.ebitdaRange && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">EBITDA Range</p>
              <p className="font-medium">{onboarding.ebitdaRange}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Preferred Ownership
            </p>
            <p className="font-medium">{onboarding.preferredOwnership}</p>
          </div>
          {onboarding.typicalHoldPeriod && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Typical Hold Period
              </p>
              <p className="font-medium">{onboarding.typicalHoldPeriod}</p>
            </div>
          )}
          {onboarding.leverageTolerance && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Leverage Tolerance
              </p>
              <p className="font-medium">{onboarding.leverageTolerance}</p>
            </div>
          )}
        </div>
        {onboarding.transactionTypes &&
          onboarding.transactionTypes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Transaction Types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {onboarding.transactionTypes.map((type, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
      </div>

      <Separator />

      {/* Company Profile */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Company Profile Preferences</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Revenue Characteristics
            </p>
            <p className="font-medium">{onboarding.revenueCharacteristics}</p>
          </div>
          {onboarding.customerConcentration && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Customer Concentration
              </p>
              <p className="font-medium">{onboarding.customerConcentration}</p>
            </div>
          )}
          {onboarding.marginsAndCashFlow && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Margins & Cash Flow
              </p>
              <p className="font-medium">{onboarding.marginsAndCashFlow}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Asset Profile</p>
            <p className="font-medium">{onboarding.assetProfile}</p>
          </div>
          {onboarding.managementInvolvement && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Management Involvement
              </p>
              <p className="font-medium">{onboarding.managementInvolvement}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Sectors & Themes */}
      <div>
        <h3 className="text-sm font-semibold mb-3 pb-2 border-b">
          Sectors & Themes
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Sectors of Interest
            </p>
            <p className="font-medium">{onboarding.sectorsOfInterest}</p>
          </div>
          {onboarding.sectorsToAvoid && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Sectors to Avoid
              </p>
              <p className="font-medium">{onboarding.sectorsToAvoid}</p>
            </div>
          )}
          {onboarding.specificThemes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Specific Themes
              </p>
              <p className="font-medium">{onboarding.specificThemes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {(onboarding.openToEmergingSponsor ||
        onboarding.economicsDescription ||
        onboarding.governanceExpectations) && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3 pb-2 border-b">
              Additional Information
            </h3>
            <div className="space-y-3 text-sm">
              {onboarding.openToEmergingSponsor && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Open to Emerging Sponsor
                  </p>
                  <p className="font-medium">
                    {onboarding.openToEmergingSponsor}
                  </p>
                </div>
              )}
              {onboarding.economicsDescription && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Economics Description
                  </p>
                  <p className="font-medium">
                    {onboarding.economicsDescription}
                  </p>
                </div>
              )}
              {onboarding.governanceExpectations && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Governance Expectations
                  </p>
                  <p className="font-medium">
                    {onboarding.governanceExpectations}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

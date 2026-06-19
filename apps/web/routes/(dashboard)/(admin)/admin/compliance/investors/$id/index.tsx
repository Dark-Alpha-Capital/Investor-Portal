import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchComplianceInvestorData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessStatusSummary } from "@/components/investor-compliance-access-status-summary";
import { DocumentReview } from "@/components/investor-compliance-document-review";
import { InvestorKycDetails } from "@/components/investor-compliance-investor-kyc-details";
import { OnboardingEditHistory } from "@/components/investor-compliance-onboarding-edit-history";
import { VehiclePermissions } from "@/components/investor-compliance-vehicle-permissions";
import { AuditHistory } from "@/components/investor-compliance-audit-history";
import { ClearanceForm } from "@/components/investor-compliance-clearance-form";
import type { ComplianceInvestorLoaderData } from "@/lib/server-fns/admin-route-data";

export const Route = createFileRoute(
  "/(dashboard)/(admin)/admin/compliance/investors/$id/",
)({
  loader: async ({ params }: { params: { id: string } }) => {
    const r = await fetchComplianceInvestorData({
      data: { investorId: params.id },
    });
    if (r.tag === "not_found") {
      throw notFound();
    }
    return r.data;
  },
  component: InvestorComplianceRoutePage,
});

function getInitials(name: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function InvestorComplianceRoutePage() {
  const data = Route.useLoaderData();
  return <InvestorComplianceInner data={data} />;
}

function InvestorComplianceInner({
  data,
}: {
  data: ComplianceInvestorLoaderData;
}) {
  const {
    investorId,
    investor,
    onboarding,
    permissions,
    auditLog,
    availableDeals,
  } = data;

  const onboardingForComponent = onboarding as Record<string, unknown>;
  const auditLogForComponent = auditLog;

  const getClearanceStatusBadge = () => {
    if (!investor.clearance) {
      return <Badge variant="secondary">No Clearance</Badge>;
    }
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pending" },
      cleared: { variant: "default", label: "Cleared" },
      cleared_with_conditions: {
        variant: "outline",
        label: "Cleared w/ Conditions",
      },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const status = investor.clearance.status as string;
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const editHistory = onboardingForComponent?.editHistory as
    | unknown[]
    | undefined;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link to="/admin/compliance">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Compliance
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={investor.image || undefined}
                alt={investor.name || "User"}
              />
              <AvatarFallback className="text-lg">
                {getInitials(investor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {investor.name || "Unknown Investor"}
              </h1>
              <p className="text-muted-foreground">{investor.email}</p>
              <div className="mt-2 flex items-center gap-2">
                {getClearanceStatusBadge()}
                {investor.isOnboardingCompleted ? (
                  <Badge variant="default">Onboarding Complete</Badge>
                ) : (
                  <Badge variant="secondary">Onboarding Incomplete</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <AccessStatusSummary
          clearance={investor.clearance}
          permissions={permissions}
          isOnboardingCompleted={investor.isOnboardingCompleted ?? false}
        />

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="documents">Documents Review</TabsTrigger>
            <TabsTrigger value="kyc">KYC Information</TabsTrigger>
            <TabsTrigger value="edits">
              Investor Edits
              {editHistory && editHistory.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {editHistory.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clearance">Clearance</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit History</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentReview
              documents={(onboardingForComponent?.documents as unknown[]) || []}
              investorId={investorId}
            />
          </TabsContent>

          <TabsContent value="kyc">
            <InvestorKycDetails
              onboarding={onboardingForComponent}
              userEmail={investor.email}
              userName={investor.name}
            />
          </TabsContent>

          <TabsContent value="edits">
            <OnboardingEditHistory
              editHistory={
                (onboardingForComponent?.editHistory as unknown[]) || []
              }
              lastEditedAt={
                (onboardingForComponent?.lastEditedAt as string | null) || null
              }
              editCount={
                (onboardingForComponent?.editCount as number | null) || null
              }
            />
          </TabsContent>

          <TabsContent value="clearance">
            <ClearanceForm
              investorId={investorId}
              currentStatus={
                investor.clearance?.status as
                  | "pending"
                  | "cleared"
                  | "cleared_with_conditions"
                  | "rejected"
                  | null
              }
              currentConditions={investor.clearance?.conditionsJson || null}
              currentNotes={investor.clearance?.notes || null}
              isOnboardingCompleted={investor.isOnboardingCompleted ?? false}
            />
          </TabsContent>

          <TabsContent value="permissions">
            <VehiclePermissions
              investorId={investorId}
              permissions={permissions}
              availableDeals={availableDeals}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditHistory entries={auditLogForComponent as never} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

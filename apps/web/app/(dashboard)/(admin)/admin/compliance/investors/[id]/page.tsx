import "server-only";
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { authSession } from "@/app/(auth)/auth";
import { caller } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClearanceForm } from "./components/clearance-form";
import { InvestorKycDetails } from "./components/investor-kyc-details";
import { DocumentReview } from "./components/document-review";
import { OnboardingEditHistory } from "./components/onboarding-edit-history";
import { VehiclePermissions } from "./components/vehicle-permissions";
import { AuditHistory } from "./components/audit-history";

type PageProps = {
  params: Promise<{ id: string }>;
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function InvestorCompliancePage({ params }: PageProps) {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/admin/compliance">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Compliance
          </Button>
        </Link>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <InvestorComplianceContent investorId={id} />
      </Suspense>
    </div>
  );
}

async function InvestorComplianceContent({
  investorId,
}: {
  investorId: string;
}) {
  const data = await caller.compliance.getInvestorDetails({
    userId: investorId,
  });

  if (!data.success || !data.investor) {
    notFound();
  }

  const { investor, onboarding, permissions, auditLog } = data;

  // Cast the onboarding data to match the component's expected type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onboardingForComponent = onboarding as any;

  // Cast the audit log entries to match the component's expected type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditLogForComponent = auditLog as any;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getClearanceStatusBadge = () => {
    if (!investor.clearance) {
      return <Badge variant="outline">No Clearance</Badge>;
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
    const config =
      statusConfig[investor.clearance.status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
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
            <div className="flex items-center gap-2 mt-2">
              {getClearanceStatusBadge()}
              {investor.isOnboardingCompleted ? (
                <Badge variant="default">Onboarding Complete</Badge>
              ) : (
                <Badge variant="outline">Onboarding Incomplete</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="documents">Documents Review</TabsTrigger>
          <TabsTrigger value="kyc">KYC Information</TabsTrigger>
          <TabsTrigger value="edits">
            Investor Edits
            {onboardingForComponent?.editHistory?.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {onboardingForComponent.editHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clearance">Clearance</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentReview
            documents={onboardingForComponent?.documents || []}
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
            editHistory={onboardingForComponent?.editHistory || []}
            lastEditedAt={onboardingForComponent?.lastEditedAt || null}
            editCount={onboardingForComponent?.editCount || null}
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
          />
        </TabsContent>

        <TabsContent value="permissions">
          <VehiclePermissions
            investorId={investorId}
            permissions={permissions}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditHistory entries={auditLogForComponent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

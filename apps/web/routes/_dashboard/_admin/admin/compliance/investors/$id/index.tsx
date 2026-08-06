import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { fetchComplianceInvestorData } from "@/lib/server-fns/admin-route-data";
import type { ComplianceInvestorLoaderData } from "@/lib/server-fns/admin-route-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessStatusSummary } from "@/components/investor-compliance-access-status-summary";
import { DocumentReview } from "@/components/investor-compliance-document-review";
import { InvestorKycDetails } from "@/components/investor-compliance-investor-kyc-details";
import { DealInvitations } from "@/components/investor-compliance-deal-invitations";
import { AuditHistory } from "@/components/investor-compliance-audit-history";
import { ClearanceForm } from "@/components/investor-compliance-clearance-form";
import type { ParticipationStatus } from "@/lib/participation";

const TAB_VALUES = [
  "documents",
  "kyc",
  "status",
  "invitations",
  "audit",
] as const;

const searchSchema = z.object({
  tab: z.enum(TAB_VALUES).optional(),
});

type ComplianceInvestorSearch = z.infer<typeof searchSchema>;

function parseSearch(search: Record<string, unknown>): ComplianceInvestorSearch {
  return searchSchema.parse(search);
}

function complianceInvestorQueryOptions(investorId: string) {
  return queryOptions({
    queryKey: ["compliance", "investor", investorId] as const,
    queryFn: async (): Promise<ComplianceInvestorLoaderData> => {
      const r = await fetchComplianceInvestorData({
        data: { investorId },
      });
      if (r.tag === "not_found") {
        throw notFound();
      }
      return r.data;
    },
  });
}

export const Route = createFileRoute(
  "/_dashboard/_admin/admin/compliance/investors/$id/",
)({
  validateSearch: parseSearch,
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(
      complianceInvestorQueryOptions(params.id),
    );
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
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading }: UseQueryResult<ComplianceInvestorLoaderData> =
    useQuery(complianceInvestorQueryOptions(id));

  if (isLoading && !data) {
    return (
      <div className="container mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const activeTab = tab ?? "documents";

  return (
    <InvestorComplianceInner
      data={data}
      activeTab={activeTab}
      onTabChange={(next) => {
        void navigate({
          search: (prev) => ({
            ...prev,
            tab: next === "documents" ? undefined : next,
          }),
          replace: true,
        });
      }}
    />
  );
}

function InvestorComplianceInner({
  data,
  activeTab,
  onTabChange,
}: {
  data: ComplianceInvestorLoaderData;
  activeTab: (typeof TAB_VALUES)[number];
  onTabChange: (tab: (typeof TAB_VALUES)[number]) => void;
}) {
  const {
    investorId,
    investor,
    onboarding,
    permissions,
    auditLog,
  } = data;

  const onboardingForComponent = onboarding as Record<string, unknown>;
  const auditLogForComponent = auditLog;

  const getClearanceStatusBadge = () => {
    if (!investor.clearance) {
      return <Badge variant="secondary">No Status</Badge>;
    }
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending_review: { variant: "secondary", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      needs_information: {
        variant: "outline",
        label: "Needs Information",
      },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const status = investor.clearance.status as string;
    const config = statusConfig[status] || statusConfig.pending_review;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isApproved = investor.clearance?.status === "approved";

  const invitations = (permissions as Array<Record<string, unknown>>).map(
    (p) => ({
      id: p.id as string,
      dealId: p.dealId as string,
      dealName: (p.dealName as string) || "Unknown Deal",
      accessLevel: (p.accessLevel as "teaser" | "data_room") || "teaser",
      grantedAt: p.grantedAt as Date | string,
      grantedByName: (p.grantedByName as string | null) ?? null,
      participationStatus: p.participationStatus as
        | ParticipationStatus
        | undefined,
      dataRoomRequestedAt:
        (p.dataRoomRequestedAt as Date | string | null | undefined) ?? null,
      dataRoomRequestMessage:
        (p.dataRoomRequestMessage as string | null | undefined) ?? null,
    }),
  );

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
          permissions={invitations}
          isOnboardingCompleted={investor.isOnboardingCompleted ?? false}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            onTabChange(value as (typeof TAB_VALUES)[number])
          }
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="documents">Documents Review</TabsTrigger>
            <TabsTrigger value="kyc">KYC Information</TabsTrigger>
            <TabsTrigger value="status">Global Status</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
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

          <TabsContent value="status">
            <ClearanceForm
              investorId={investorId}
              currentStatus={
                investor.clearance?.status as
                  | "pending_review"
                  | "approved"
                  | "needs_information"
                  | "rejected"
                  | null
              }
              currentConditions={investor.clearance?.conditionsJson || null}
              currentNotes={investor.clearance?.notes || null}
              currentInvestorVisibleNotes={
                investor.clearance?.investorVisibleNotes || null
              }
              isOnboardingCompleted={investor.isOnboardingCompleted ?? false}
            />
          </TabsContent>

          <TabsContent value="invitations">
            <DealInvitations
              investorId={investorId}
              invitations={invitations}
              isApproved={!!isApproved}
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

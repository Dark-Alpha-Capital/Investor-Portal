import React from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { getUserWithOnboarding } from "@repo/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Calendar,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { DocumentActions } from "./components/document-actions";
import { KycStatusToggle } from "./components/kyc-status-toggle";

type Params = {
  userId: Promise<string>;
};

const getKycStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    pending_docs: { variant: "outline", label: "Pending Documents" },
    rejected: { variant: "destructive", label: "Rejected" },
  };

  const config = statusConfig[status || "review"] || statusConfig.review;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getOnboardingStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    draft: {
      variant: "outline",
      label: "Draft",
      icon: <FileText className="w-3 h-3" />,
    },
    submitted: {
      variant: "secondary",
      label: "Submitted",
      icon: <Clock className="w-3 h-3" />,
    },
    under_review: {
      variant: "secondary",
      label: "Under Review",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    approved: {
      variant: "default",
      label: "Approved",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      icon: <XCircle className="w-3 h-3" />,
    },
    needs_more_info: {
      variant: "outline",
      label: "Needs More Info",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = statusConfig[status || "draft"] || statusConfig.draft;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const formatFileSize = (size: string) => {
  const bytes = parseInt(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminUserPage = async ({ params }: { params: Promise<Params> }) => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Check if current user is admin
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const resolvedParams = await params;
  const userId = await resolvedParams.userId;
  const userData = await getUserWithOnboarding(userId);

  if (!userData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { user, onboarding, documents } = userData;
  const isAdminUser = user.role === "admin";
  const isBanned = user.banned;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || user.email}
            />
            <AvatarFallback className="text-lg">
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : user.email?.[0].toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {user.name || "Unknown User"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isAdminUser ? "default" : "secondary"}>
                {isAdminUser ? "Admin" : "User"}
              </Badge>
              {isBanned && <Badge variant="destructive">Banned</Badge>}
              {getKycStatusBadge(user.kycStatus)}
            </div>
          </div>
        </div>
        {!isAdminUser && (
          <div className="flex flex-col items-end gap-2">
            <KycStatusToggle userId={user.id} currentStatus={user.kycStatus} />
          </div>
        )}
      </div>

      {/* Admin User View */}
      {isAdminUser ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin User Profile
            </CardTitle>
            <CardDescription>
              Administrative account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "PPP")
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Email Verified
                  </p>
                  <p className="font-medium">
                    {user.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {isBanned && (
                <>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ban Reason
                      </p>
                      <p className="font-medium">
                        {user.banReason || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {user.banExpires && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ban Expires
                        </p>
                        <p className="font-medium">
                          {format(new Date(user.banExpires), "PPP")}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Admin users do not have onboarding data as they are internal
                team members.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Regular User View */
        <>
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Member Since
                    </p>
                    <p className="font-medium">
                      {user.createdAt
                        ? format(new Date(user.createdAt), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Email Verified
                    </p>
                    <p className="font-medium">
                      {user.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Onboarding Completed
                    </p>
                    <p className="font-medium">
                      {user.isOnboardingCompleted ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                {isBanned && (
                  <>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ban Reason
                        </p>
                        <p className="font-medium">
                          {user.banReason || "Not specified"}
                        </p>
                      </div>
                    </div>
                    {user.banExpires && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Ban Expires
                          </p>
                          <p className="font-medium">
                            {format(new Date(user.banExpires), "PPP")}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Status */}
          {!user.isOnboardingCompleted ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Onboarding Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This user has not completed the onboarding process yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : onboarding ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="onboarding">Onboarding Details</TabsTrigger>
                <TabsTrigger value="documents">KYC Documents</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarding Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      {getOnboardingStatusBadge(onboarding.status)}
                    </div>
                    {onboarding.submittedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Submitted
                        </span>
                        <span className="font-medium">
                          {format(new Date(onboarding.submittedAt), "PPP")}
                        </span>
                      </div>
                    )}
                    {onboarding.reviewedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Reviewed
                        </span>
                        <span className="font-medium">
                          {format(new Date(onboarding.reviewedAt), "PPP")}
                        </span>
                      </div>
                    )}
                    {onboarding.reviewNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Review Notes
                        </p>
                        <p className="text-sm bg-muted p-3 rounded-lg">
                          {onboarding.reviewNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>KYC Status</CardTitle>
                    <CardDescription>
                      Review documents and update the KYC status accordingly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Current Status
                        </span>
                        {getKycStatusBadge(user.kycStatus)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-sm font-medium">Update Status</p>
                          <p className="text-xs text-muted-foreground">
                            Change the KYC status after reviewing documents
                          </p>
                        </div>
                        <KycStatusToggle
                          userId={user.id}
                          currentStatus={user.kycStatus}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Documents
                      </span>
                      <span className="font-medium">{documents.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onboarding Details Tab */}
              <TabsContent value="onboarding" className="space-y-4">
                {/* Section 1: Investor / Lender Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Investor / Lender Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Organization Name
                        </p>
                        <p className="font-medium">
                          {onboarding.organizationName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Primary Contact
                        </p>
                        <p className="font-medium">
                          {onboarding.primaryContactName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Contact Title
                        </p>
                        <p className="font-medium">
                          {onboarding.primaryContactTitle || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">
                            {onboarding.primaryContactEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {onboarding.primaryContactPhone}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Capital Provider Type
                        </p>
                        <p className="font-medium">
                          {onboarding.capitalProviderType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Investor Type
                        </p>
                        <p className="font-medium">{onboarding.investorType}</p>
                      </div>
                      {onboarding.geographicFocus && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Geographic Focus
                            </p>
                            <p className="font-medium">
                              {onboarding.geographicFocus}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Investment Mandate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Investment Mandate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Equity Check Size
                        </p>
                        <p className="font-medium">
                          {onboarding.equityCheckSize}
                        </p>
                      </div>
                      {onboarding.enterpriseValueRange && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Enterprise Value Range
                          </p>
                          <p className="font-medium">
                            {onboarding.enterpriseValueRange}
                          </p>
                        </div>
                      )}
                      {onboarding.ebitdaRange && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            EBITDA Range
                          </p>
                          <p className="font-medium">
                            {onboarding.ebitdaRange}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Preferred Ownership
                        </p>
                        <p className="font-medium">
                          {onboarding.preferredOwnership}
                        </p>
                      </div>
                      {onboarding.typicalHoldPeriod && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Typical Hold Period
                          </p>
                          <p className="font-medium">
                            {onboarding.typicalHoldPeriod}
                          </p>
                        </div>
                      )}
                      {onboarding.leverageTolerance && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Leverage Tolerance
                          </p>
                          <p className="font-medium">
                            {onboarding.leverageTolerance}
                          </p>
                        </div>
                      )}
                    </div>
                    {onboarding.transactionTypes &&
                      onboarding.transactionTypes.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Transaction Types
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {onboarding.transactionTypes.map((type, idx) => (
                              <Badge key={idx} variant="outline">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Section 3: Company Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Company Profile Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Revenue Characteristics
                        </p>
                        <p className="font-medium">
                          {onboarding.revenueCharacteristics}
                        </p>
                      </div>
                      {onboarding.customerConcentration && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Customer Concentration
                          </p>
                          <p className="font-medium">
                            {onboarding.customerConcentration}
                          </p>
                        </div>
                      )}
                      {onboarding.marginsAndCashFlow && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Margins & Cash Flow
                          </p>
                          <p className="font-medium">
                            {onboarding.marginsAndCashFlow}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Asset Profile
                        </p>
                        <p className="font-medium">{onboarding.assetProfile}</p>
                      </div>
                      {onboarding.managementInvolvement && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Management Involvement
                          </p>
                          <p className="font-medium">
                            {onboarding.managementInvolvement}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Sectors & Themes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sectors & Themes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Sectors of Interest
                      </p>
                      <p className="font-medium">
                        {onboarding.sectorsOfInterest}
                      </p>
                    </div>
                    {onboarding.sectorsToAvoid && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Sectors to Avoid
                        </p>
                        <p className="font-medium">
                          {onboarding.sectorsToAvoid}
                        </p>
                      </div>
                    )}
                    {onboarding.specificThemes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Specific Themes
                        </p>
                        <p className="font-medium">
                          {onboarding.specificThemes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Sections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {onboarding.openToEmergingSponsor && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Open to Emerging Sponsor
                        </p>
                        <p className="font-medium">
                          {onboarding.openToEmergingSponsor}
                        </p>
                      </div>
                    )}
                    {onboarding.economicsDescription && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Economics Description
                        </p>
                        <p className="font-medium">
                          {onboarding.economicsDescription}
                        </p>
                      </div>
                    )}
                    {onboarding.governanceExpectations && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Governance Expectations
                        </p>
                        <p className="font-medium">
                          {onboarding.governanceExpectations}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      KYC Documents
                    </CardTitle>
                    <CardDescription>
                      {documents.length === 0
                        ? "No documents uploaded"
                        : `${documents.length} document${documents.length !== 1 ? "s" : ""} uploaded`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No documents have been uploaded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <Card key={doc.id} className="border">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium capitalize">
                                      {doc.documentType
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}
                                    </p>
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>File: {doc.fileName}</p>
                                    <p>Size: {formatFileSize(doc.fileSize)}</p>
                                    <p>Type: {doc.fileType}</p>
                                    <p>
                                      Uploaded:{" "}
                                      {doc.uploadedAt
                                        ? format(
                                            new Date(doc.uploadedAt),
                                            "PPP"
                                          )
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                                {doc.fileUrl && (
                                  <DocumentActions
                                    documentId={doc.id}
                                    fileName={doc.fileName}
                                    fileType={doc.fileType}
                                  />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Onboarding data not found. This may indicate an issue with
                    the onboarding process.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUserPage;

import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authSession } from "@/app/(auth)/auth";
import { getUserWithOnboarding } from "@repo/db/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { UserHeader } from "./components/user-header";
import { UserBasicInfo } from "./components/user-basic-info";
import { AdminUserView } from "./components/admin-user-view";
import { OnboardingOverview } from "./components/onboarding-overview";
import { OnboardingDetails } from "./components/onboarding-details";
import { DocumentsList } from "./components/documents-list";
import { UserDetailSkeleton } from "@/components/skeleton/user-detail-skeleton";

type Params = {
  userId: Promise<string>;
};

const AdminUserPage = async ({ params }: { params: Promise<Params> }) => {
  return (
    <Suspense fallback={<UserDetailSkeleton />}>
      <FetchUserWrapper p={params} />
    </Suspense>
  );
};

async function FetchUserWrapper({ p }: { p: Promise<Params> }) {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Check if current user is admin (by role or email domain as fallback)
  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const resolvedParams = await p;
  const userId = await resolvedParams.userId;

  return (
    <Suspense fallback={<UserDetailSkeleton />}>
      <FetchUserContent userId={userId} />
    </Suspense>
  );
}

async function FetchUserContent({ userId }: { userId: string }) {
  const userData = await getUserWithOnboarding(userId);

  if (!userData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="rounded-lg border bg-card p-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">User Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The user you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { user, onboarding, documents } = userData;

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="rounded-lg border bg-card p-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">User Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The user you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdminUser = user.role === "admin";

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* User Header Section */}
        <div className="rounded-lg border bg-card p-6">
          <UserHeader
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              banned: user.banned,
              kycStatus: user.kycStatus,
            }}
          />
        </div>

        {/* Main Content Section */}
        <div className="rounded-lg border bg-card p-6">
          {isAdminUser ? (
            <AdminUserView
              user={{
                email: user.email,
                createdAt: user.createdAt,
                emailVerified: user.emailVerified,
                banned: user.banned,
                banReason: user.banReason,
                banExpires: user.banExpires,
                isOnboardingCompleted: user.isOnboardingCompleted,
              }}
            />
          ) : (
            <>
              <UserBasicInfo
                user={{
                  email: user.email,
                  createdAt: user.createdAt,
                  emailVerified: user.emailVerified,
                  isOnboardingCompleted: user.isOnboardingCompleted,
                  banned: user.banned,
                  banReason: user.banReason,
                  banExpires: user.banExpires,
                }}
              />

              {!user.isOnboardingCompleted ? (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Onboarding Status</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This user has not completed the onboarding process yet.
                  </p>
                </div>
              ) : onboarding ? (
                <div className="mt-6 pt-6 border-t">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="onboarding">
                        Onboarding Details
                      </TabsTrigger>
                      <TabsTrigger value="documents">
                        Documents ({documents.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      <OnboardingOverview
                        onboarding={onboarding}
                        user={{
                          id: user.id,
                          kycStatus: user.kycStatus,
                        }}
                        documentsCount={documents.length}
                      />
                    </TabsContent>

                    <TabsContent value="onboarding" className="mt-6">
                      <OnboardingDetails onboarding={onboarding} />
                    </TabsContent>

                    <TabsContent value="documents" className="mt-6">
                      <DocumentsList documents={documents} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Onboarding Data</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Onboarding data not found. This may indicate an issue with
                    the onboarding process.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserPage;

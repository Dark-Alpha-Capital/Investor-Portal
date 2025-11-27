import React from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { getUserWithOnboarding } from "@repo/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { UserHeader } from "./components/user-header";
import { UserBasicInfo } from "./components/user-basic-info";
import { AdminUserView } from "./components/admin-user-view";
import { OnboardingOverview } from "./components/onboarding-overview";
import { OnboardingDetails } from "./components/onboarding-details";
import { DocumentsList } from "./components/documents-list";

type Params = {
  userId: Promise<string>;
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
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">User Not Found</h2>
              <p className="text-sm text-muted-foreground">
                The user you're looking for doesn't exist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, onboarding, documents } = userData;
  const isAdminUser = user.role === "admin";

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardContent className="p-6">
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
            onboarding={
              onboarding
                ? { id: onboarding.id, status: onboarding.status }
                : null
            }
          />

          {isAdminUser ? (
            <div className="mt-4">
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
            </div>
          ) : (
            <>
              <div className="mt-4">
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
              </div>

              {!user.isOnboardingCompleted ? (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Onboarding Status</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This user has not completed the onboarding process yet.
                  </p>
                </div>
              ) : onboarding ? (
                <div className="mt-4 pt-4 border-t">
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

                    <TabsContent value="overview" className="mt-4">
                      <OnboardingOverview
                        onboarding={onboarding}
                        user={user}
                        documentsCount={documents.length}
                      />
                    </TabsContent>

                    <TabsContent value="onboarding" className="mt-4">
                      <OnboardingDetails onboarding={onboarding} />
                    </TabsContent>

                    <TabsContent value="documents" className="mt-4">
                      <DocumentsList documents={documents} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserPage;

import "server-only";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { db } from "@repo/db";
import { user, onboarding, onboardingEditHistory } from "@repo/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { OnboardingFlow } from "../onboarding-flow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  ShieldX,
  Pencil,
  History,
  ArrowRight,
  Calendar,
} from "lucide-react";

/**
 * Server component that handles runtime data (session).
 * Checks auth, admin status, and onboarding status.
 *
 * This component must be wrapped in Suspense because it accesses
 * runtime data (session) and calls a cached async function.
 */
export async function OnboardingContent() {
  // Auth check - runtime data access
  const session = await authSession();

  if (!session) {
    console.log("User is not logged in");
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <ShieldX className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">
                Admin Access Restricted
              </CardTitle>
              <CardDescription className="mt-2">
                Administrators cannot access the onboarding form
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              As an administrator, you do not have access to the investor
              onboarding process. Please use the admin dashboard to manage users
              and review onboarding submissions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading onboarding status...
          </div>
        </div>
      }
    >
      <FetchOnboardingWrapper userId={userId} />
    </Suspense>
  );
}

async function FetchOnboardingWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`onboarding-status-${userId}`);

  const [userData] = await db
    .select({
      isOnboardingCompleted: user.isOnboardingCompleted,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const isOnboarded = userData?.isOnboardingCompleted ?? false;

  if (isOnboarded) {
    // Fetch onboarding data and edit history
    const [onboardingData] = await db
      .select({
        id: onboarding.id,
        submittedAt: onboarding.submittedAt,
        lastEditedAt: onboarding.lastEditedAt,
        editCount: onboarding.editCount,
        isEditable: onboarding.isEditable,
        organizationName: onboarding.organizationName,
      })
      .from(onboarding)
      .where(eq(onboarding.userId, userId))
      .orderBy(desc(onboarding.createdAt))
      .limit(1);

    // Fetch edit history if onboarding exists
    let editHistory: {
      id: string;
      fieldName: string;
      fieldLabel: string | null;
      previousValue: string | null;
      newValue: string | null;
      editedAt: Date;
    }[] = [];

    if (onboardingData?.id) {
      editHistory = await db
        .select({
          id: onboardingEditHistory.id,
          fieldName: onboardingEditHistory.fieldName,
          fieldLabel: onboardingEditHistory.fieldLabel,
          previousValue: onboardingEditHistory.previousValue,
          newValue: onboardingEditHistory.newValue,
          editedAt: onboardingEditHistory.editedAt,
        })
        .from(onboardingEditHistory)
        .where(eq(onboardingEditHistory.onboardingId, onboardingData.id))
        .orderBy(desc(onboardingEditHistory.editedAt))
        .limit(10);
    }

    const editCount = parseInt(onboardingData?.editCount || "0", 10);
    const isEditable = onboardingData?.isEditable !== false;

    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl space-y-6">
        {/* Status Card */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Onboarding Complete</CardTitle>
                  <CardDescription className="mt-1">
                    {onboardingData?.organizationName || "Your profile"} has been submitted
                  </CardDescription>
                </div>
              </div>
              {editCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {editCount} edit{editCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Submission Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {onboardingData?.submittedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Submitted:{" "}
                    {format(new Date(onboardingData.submittedAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {onboardingData?.lastEditedAt && (
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span>
                    Last edited:{" "}
                    {format(new Date(onboardingData.lastEditedAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {isEditable && (
                <Button asChild>
                  <Link href="/profile/edit-onboarding">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Onboarding
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>

            {!isEditable && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                Editing has been disabled for your onboarding. Please contact support if you need to make changes.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit History Card */}
        {editHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Edit History
              </CardTitle>
              <CardDescription>
                Your most recent changes to the onboarding form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {editHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {entry.fieldLabel || entry.fieldName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-muted-foreground line-through bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded truncate max-w-[150px]">
                              {entry.previousValue || "(empty)"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded truncate max-w-[150px] font-medium">
                              {entry.newValue || "(empty)"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.editedAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {editHistory.length >= 10 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Showing the 10 most recent changes
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return <OnboardingFlow />;
}

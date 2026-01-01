import "server-only";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingFlow } from "../onboarding-flow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldX } from "lucide-react";

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
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="text-center border-green-200 dark:border-green-900">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">
                Onboarding Already Complete
              </CardTitle>
              <CardDescription className="mt-2">
                You have already submitted your onboarding form
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Your onboarding form has been successfully submitted and cannot be
              filled out again. Please visit your dashboard to view your profile
              and manage your account.
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OnboardingFlow />;
}

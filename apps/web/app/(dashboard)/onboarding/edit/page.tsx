import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { authSession } from "@/app/(auth)/auth";
import { getUserWithOnboarding } from "@repo/db/queries";
import { OnboardingFlow } from "../onboarding-flow";
import { OnboardingSkeleton } from "@/components/skeleton/onboarding-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldX, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Edit Onboarding Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: EditOnboardingContentWrapper wrapped in Suspense (streamed at request time)
 *
 * The EditOnboardingContentWrapper component:
 * - Handles runtime data (session + role check)
 * - Renders admin restriction screen when applicable
 * - Delegates data fetching to FetchEditOnboardingWrapper which reads from @repo/db/queries
 */
export default function EditOnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <EditOnboardingContentWrapper />
    </Suspense>
  );
}

async function EditOnboardingContentWrapper() {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

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
                Administrators cannot edit onboarding information.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              As an administrator, you do not have access to the investor
              onboarding editing flow. Please use the admin dashboard to manage
              users and review onboarding submissions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = session.user.id;

  return <FetchEditOnboardingWrapper userId={userId} />;
}

async function FetchEditOnboardingWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`onboarding-edit-${userId}`);

  const data = await getUserWithOnboarding(userId);

  if (!data || !data.onboarding) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Onboarding Found</AlertTitle>
          <AlertDescription>
            You haven&apos;t completed the onboarding process yet.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/onboarding">Start Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if editing is disabled on the latest onboarding record
  if (data.onboarding.isEditable === false) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Editing Disabled</AlertTitle>
          <AlertDescription>
            Your onboarding information can no longer be edited. Please contact
            support if you need to make changes.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link href="/onboarding">Back to Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow
      editMode
      // Cast to any to satisfy the client-side ExistingOnboardingData type
      existingOnboarding={data.onboarding as any}
    />
  );
}

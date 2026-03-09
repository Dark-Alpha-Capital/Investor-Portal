import "server-only";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import {
  getUserOnboardingStatus,
  getOnboardingWithEditHistory,
} from "@repo/db/queries";
import { OnboardingFlow } from "./onboarding-flow";
import { OnboardingSkeleton } from "@/components/skeleton/onboarding-skeleton";
import { OnboardingCompleteView } from "./components/onboarding-complete-view";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

/**
 * Onboarding Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: OnboardingContentWrapper wrapped in Suspense (streamed at request time)
 *
 * The OnboardingContentWrapper component:
 * - Handles runtime data (session check)
 * - Checks if user is admin or already onboarded
 * - Renders appropriate screen or OnboardingFlow
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingContentWrapper />
    </Suspense>
  );
}

async function OnboardingContentWrapper() {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <section className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <ShieldX className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl">
                Admin Access Restricted
              </h3>
              <p className="mt-2">
                Administrators cannot access the onboarding form
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              As an administrator, you do not have access to the investor
              onboarding process. Please use the admin dashboard to manage users
              and review onboarding submissions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const userId = session.user.id;

  return <FetchOnboardingWrapper userId={userId} />;
}

async function FetchOnboardingWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`onboarding-status-${userId}`);

  const { isOnboardingCompleted } = await getUserOnboardingStatus(userId);

  if (isOnboardingCompleted) {
    const data = await getOnboardingWithEditHistory(userId);

    if (!data) {
      return <OnboardingFlow />;
    }

    return (
      <OnboardingCompleteView
        onboardingData={data.onboarding}
        editHistory={data.editHistory}
      />
    );
  }

  return <OnboardingFlow />;
}

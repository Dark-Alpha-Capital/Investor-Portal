import { Suspense } from "react";
import { OnboardingContent } from "./components/onboarding-content";
import { OnboardingSkeleton } from "@/components/skeleton/onboarding-skeleton";

/**
 * Onboarding Page using Next.js Cache Components pattern.
 *
 * Structure:
 * - Static shell: Page wrapper (prerendered)
 * - Dynamic content: OnboardingContent wrapped in Suspense (streamed at request time)
 *
 * The OnboardingContent component:
 * - Handles runtime data (session check)
 * - Checks if user is admin or already onboarded
 * - Renders appropriate screen or OnboardingFlow
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingContent />
    </Suspense>
  );
}

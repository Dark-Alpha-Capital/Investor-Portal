import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { fetchOnboardingEditPageData } from "@/lib/server-fns/onboarding-route-data";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OnboardingFlow } from "../-onboarding-flow";

type UserOnboarding = NonNullable<
  Awaited<
    ReturnType<typeof import("@repo/db/queries").getUserWithOnboarding>
  >["onboarding"]
>;

export type OnboardingEditPageLoaderState =
  | { tag: "no_onboarding" }
  | { tag: "editing_disabled" }
  | { tag: "edit_flow"; existingOnboarding: UserOnboarding };

export const Route = createFileRoute("/(dashboard)/onboarding/edit/")({
  loader: async () => {
    const r = await fetchOnboardingEditPageData();
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return r;
  },
  component: OnboardingEditRoutePage,
});

function OnboardingEditRoutePage() {
  const state = Route.useLoaderData();
  return <OnboardingEditInner state={state} />;
}

function OnboardingEditInner({
  state,
}: {
  state: OnboardingEditPageLoaderState;
}) {
  if (state.tag === "no_onboarding") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Onboarding Found</AlertTitle>
          <AlertDescription>
            You haven&apos;t completed the onboarding process yet.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to="/onboarding">Start Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (state.tag === "editing_disabled") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
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
            <Link to="/onboarding">Back to Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow
      editMode
      existingOnboarding={state.existingOnboarding as never}
    />
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchOnboardingPageData } from "@/lib/server-fns/onboarding-route-data";
import { OnboardingFlow } from "./-onboarding-flow";
import { OnboardingCompleteView } from "./components/onboarding-complete-view";

type OnboardingHistory = NonNullable<
  Awaited<
    ReturnType<typeof import("@repo/db/queries").getOnboardingWithEditHistory>
  >
>;

export type OnboardingPageLoaderState =
  | { tag: "flow" }
  | {
      tag: "complete";
      onboarding: OnboardingHistory["onboarding"];
      editHistory: OnboardingHistory["editHistory"];
    };

export const Route = createFileRoute("/(dashboard)/onboarding/")({
  loader: async () => {
    const r = await fetchOnboardingPageData();
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return r;
  },
  component: OnboardingRoutePage,
});

function OnboardingRoutePage() {
  const state = Route.useLoaderData();
  return <OnboardingPageInner state={state} />;
}

function OnboardingPageInner({
  state,
}: {
  state: OnboardingPageLoaderState;
}) {
  if (state.tag === "flow") {
    return <OnboardingFlow />;
  }

  if (state.tag === "complete") {
    return (
      <OnboardingCompleteView
        onboardingData={state.onboarding}
        editHistory={state.editHistory}
      />
    );
  }

  return null;
}

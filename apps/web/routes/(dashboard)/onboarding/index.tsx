import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { fetchOnboardingPageData } from "@/lib/server-fns/onboarding-route-data";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { OnboardingFlow } from "./-onboarding-flow";
import { OnboardingCompleteView } from "./components/onboarding-complete-view";

type OnboardingHistory = NonNullable<
  Awaited<
    ReturnType<typeof import("@repo/db/queries").getOnboardingWithEditHistory>
  >
>;

export type OnboardingPageLoaderState =
  | { tag: "admin_restricted" }
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
  if (state.tag === "admin_restricted") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <section className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <ShieldX className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl">Admin Access Restricted</h3>
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
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link to="/admin">Go to Admin Dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

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

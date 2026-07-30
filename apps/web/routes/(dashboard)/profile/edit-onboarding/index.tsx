import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { fetchProfileEditOnboardingData } from "@/lib/server-fns/onboarding-route-data";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditOnboardingProfileClient } from "./-EditOnboardingProfileClient";

type History = NonNullable<
  Awaited<
    ReturnType<typeof import("@repo/db/queries").getOnboardingWithEditHistory>
  >
>;

export type ProfileEditOnboardingLoaderState =
  | { tag: "no_onboarding" }
  | {
      tag: "ok";
      onboarding: History["onboarding"];
      editHistory: History["editHistory"];
    };

export const Route = createFileRoute(
  "/(dashboard)/profile/edit-onboarding/",
)({
  loader: async () => {
    const r = await fetchProfileEditOnboardingData();
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return r;
  },
  component: ProfileEditOnboardingRoutePage,
});

function ProfileEditOnboardingRoutePage() {
  const state = Route.useLoaderData();
  return <ProfileEditOnboardingInner state={state} />;
}

function ProfileEditOnboardingInner({
  state,
}: {
  state: ProfileEditOnboardingLoaderState;
}) {
  if (state.tag === "no_onboarding") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Onboarding Found</AlertTitle>
          <AlertDescription>
            You haven&apos;t completed the onboarding process yet.{" "}
            <Link to="/onboarding" className="text-primary underline">
              Start onboarding
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <EditOnboardingProfileClient
      onboarding={state.onboarding as never}
      editHistory={state.editHistory as never}
    />
  );
}

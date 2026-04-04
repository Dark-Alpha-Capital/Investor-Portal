import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { fetchProfileEditOnboardingData } from "@/lib/server-fns/onboarding-route-data";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditOnboardingProfileClient } from "./-EditOnboardingProfileClient";

type History = NonNullable<
  Awaited<
    ReturnType<typeof import("@repo/db/queries").getOnboardingWithEditHistory>
  >
>;

export type ProfileEditOnboardingLoaderState =
  | { tag: "admin_restricted" }
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
                Administrators cannot edit onboarding information.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              As an administrator, you do not have access to the investor
              onboarding editing flow. Please use the admin dashboard to manage
              users and review onboarding submissions.
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

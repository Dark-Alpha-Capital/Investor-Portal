import { createFileRoute, redirect } from "@tanstack/react-router";

/** Post-submit onboarding editing has been removed. */
export const Route = createFileRoute(
  "/_dashboard/profile/edit-onboarding/",
)({
  beforeLoad: () => {
    throw redirect({ to: "/onboarding" });
  },
});

import type { Session } from "@/lib/session-types";

type SessionUser = NonNullable<Session>["user"];

export function isAdminUser(user: SessionUser): boolean {
  return user.role === "admin";
}

export function isOnboardingAdminRestrictedUser(user: SessionUser): boolean {
  return (
    user.role === "admin" ||
    Boolean(user.email?.endsWith("@darkalphacapital.com"))
  );
}

/** Default in-app home for sidebar/breadcrumbs after login. */
export function getAppHomePath(user: SessionUser): "/admin" | "/dashboard" {
  return isAdminUser(user) ? "/admin" : "/dashboard";
}

/** Where to send users blocked from investor onboarding flows. */
export function getOnboardingRestrictedRedirectPath(
  user: SessionUser,
): "/admin" | "/dashboard" {
  return isAdminUser(user) ? "/admin" : "/dashboard";
}

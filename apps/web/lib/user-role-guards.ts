import type { Session } from "@/lib/session-types";

export function isOnboardingAdminRestrictedUser(
  user: NonNullable<Session>["user"],
): boolean {
  return (
    user.role === "admin" ||
    Boolean(user.email?.endsWith("@darkalphacapital.com"))
  );
}

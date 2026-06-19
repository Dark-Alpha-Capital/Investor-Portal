import { redirect } from "@tanstack/react-router";
import type { Session } from "@/lib/session-types";

/** Session shape after a successful user guard (for route context typing). */
export type AuthedSession = NonNullable<Session> & {
  user: NonNullable<NonNullable<Session>["user"]>;
};

/**
 * Use in admin routes’ `beforeLoad` after parent session is present.
 */
export function requireAdminContext(session: AuthedSession): void {
  if (session.user.role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
}

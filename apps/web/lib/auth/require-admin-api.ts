import { authSession } from "@/lib/auth/session-from-request";
import type { Session } from "@/lib/auth/session-types";

/**
 * Shared admin guard for API route handlers. Resolves the session once and
 * returns either the session (authed + admin) or a ready-to-return `Response`.
 */
export async function requireAdminApiSession(): Promise<
  | { ok: true; session: NonNullable<Session> }
  | { ok: false; response: Response }
> {
  const session = await authSession();

  if (!session?.user) {
    return {
      ok: false,
      response: Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      ok: false,
      response: Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session: session as NonNullable<Session> };
}

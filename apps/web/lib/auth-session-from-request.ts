import { getRequest } from "@tanstack/react-start/server";
import { auth as betterAuth } from "@/auth";
import type { Session } from "@/lib/session-types";

function isNoStartEventError(e: unknown): boolean {
  return (
    e instanceof Error &&
    e.message.includes("No StartEvent found in AsyncLocalStorage")
  );
}

function toSession(
  session: Awaited<ReturnType<typeof betterAuth.api.getSession>>,
): Session {
  if (!session?.user) {
    return null;
  }

  const userWithRole = session.user as typeof session.user & {
    role?: string | null;
  };

  return {
    user: {
      id: session.user.id,
      type: "regular" as const,
      email: session.user.email,
      name: session.user.name ?? undefined,
      role: userWithRole.role ?? undefined,
      image: session.user.image ?? undefined,
    },
  };
}

/**
 * Current request session (TanStack Start request context). Only valid where `getRequest()` exists.
 */
export async function authSession(): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({
      headers: getRequest().headers,
    });
    return toSession(session);
  } catch (error) {
    if (isNoStartEventError(error)) {
      return null;
    }
    console.error("Auth error:", error);
    return null;
  }
}

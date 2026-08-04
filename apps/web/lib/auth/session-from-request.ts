import { getRequest } from "@tanstack/react-start/server";
import { auth as betterAuth } from "@/auth";
import { mapBetterAuthSession } from "@/lib/auth/session-mapper";
import type { Session } from "@/lib/auth/session-types";

function isNoStartEventError(e: unknown): boolean {
  return (
    e instanceof Error &&
    e.message.includes("No StartEvent found in AsyncLocalStorage")
  );
}

/**
 * Current request session (TanStack Start request context). Only valid where `getRequest()` exists.
 */
export async function authSession(): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({
      headers: getRequest().headers,
    });
    return mapBetterAuthSession(session);
  } catch (error) {
    if (isNoStartEventError(error)) {
      return null;
    }
    console.error("Auth error:", error);
    return null;
  }
}

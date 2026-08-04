import { auth as betterAuth } from "@/auth";
import { mapBetterAuthSession } from "@/lib/auth/session-mapper";
import type { Session } from "@/lib/auth/session-types";

export type { Session, UserType } from "@/lib/auth/session-types";

/** Use from tRPC and API handlers where a concrete `Request` is available. */
export async function authSessionFromHeaders(headers: Headers): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({ headers });
    return mapBetterAuthSession(session);
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

import { auth as betterAuth } from "@/auth";
import type { Session } from "@/lib/session-types";

export type { Session, UserType } from "@/lib/session-types";

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

/** Use from tRPC and API handlers where a concrete `Request` is available. */
export async function authSessionFromHeaders(headers: Headers): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({ headers });
    return toSession(session);
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

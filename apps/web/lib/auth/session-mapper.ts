import { auth as betterAuth } from "@/auth";
import type { Session } from "@/lib/auth/session-types";

/**
 * Single implementation of the better-auth → app Session mapping.
 * Both session adapters (`session-from-request.ts`, `session.ts`) delegate here.
 */
export function mapBetterAuthSession(
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

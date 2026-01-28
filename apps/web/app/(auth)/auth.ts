import { headers } from "next/headers";
import { cache } from "react";
import { auth as betterAuth } from "@/auth";

export type UserType = "guest" | "regular";

export type Session = {
  user: {
    id: string;
    type: UserType;
    email?: string;
    name?: string;
    role?: string;
    image?: string | null;
  };
} | null;

/**
 * Auth wrapper that provides a session interface compatible with the chat SDK
 * Maps Better Auth sessions to the expected format
 */
async function _authSession(): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // Better Auth includes role from the database, but TypeScript may not recognize it
    const userWithRole = session.user as typeof session.user & {
      role?: string;
    };

    return {
      user: {
        id: session.user.id,
        type: "regular" as UserType,
        email: session.user.email,
        name: session.user.name ?? undefined,
        role: userWithRole.role ?? undefined,
        image: session.user.image ?? undefined,
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Cached version of authSession for per-request deduplication.
 * Multiple calls to authSession() within the same request will only execute once.
 */
export const authSession = cache(_authSession);

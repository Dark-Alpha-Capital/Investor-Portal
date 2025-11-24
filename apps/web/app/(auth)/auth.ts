import { headers } from "next/headers";
import { auth as betterAuth } from "@/auth";

export type UserType = "guest" | "regular";

export type Session = {
  user: {
    id: string;
    type: UserType;
    email?: string;
    name?: string;
    role?: string;
  };
} | null;

/**
 * Auth wrapper that provides a session interface compatible with the chat SDK
 * Maps Better Auth sessions to the expected format
 */
export async function authSession(): Promise<Session> {
  try {
    const session = await betterAuth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        type: "regular" as UserType,
        email: session.user.email,
        name: session.user.name ?? undefined,
        role: session.user.role ?? "user",
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

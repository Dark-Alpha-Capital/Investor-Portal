import { cache } from "react";
import { auth } from "@/auth";
import { headers } from "next/headers";

/**
 * Session type with role field included via customSession plugin
 */
export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role?: string | null; // Added by customSession plugin
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
} | null;

export type SessionUser = NonNullable<Session>["user"];

/**
 * Get typed session from Better Auth
 * Returns properly typed session with role field included via customSession plugin
 * Uses React.cache() for per-request deduplication
 */
export const getSession = cache(async (): Promise<Session> => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  // Type assertion is safe because customSession plugin ensures role is included
  return result as Session;
});

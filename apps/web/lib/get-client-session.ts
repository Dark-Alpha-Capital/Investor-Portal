import { authClient } from "@/lib/auth-client";

/**
 * Client-side session type with role field included via customSession plugin
 */
export type ClientSession = {
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

export type ClientSessionUser = NonNullable<ClientSession>["user"];

/**
 * Get typed session from Better Auth client
 * Returns properly typed session with role field included via customSession plugin
 */
export async function getClientSession(): Promise<ClientSession> {
  const result = await authClient.getSession();

  // Type assertion is safe because customSession plugin ensures role is included
  return result.data as ClientSession;
}

/**
 * Hook to get typed session reactively
 * Returns properly typed session with role field included via customSession plugin
 */
export function useClientSession(): {
  data: ClientSession;
  isPending: boolean;
  error: Error | null;
} {
  const { data: session, isPending, error } = authClient.useSession();

  // Type assertion is safe because customSession plugin ensures role is included
  return {
    data: session as ClientSession,
    isPending,
    error,
  };
}

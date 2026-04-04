import { authSession } from "@/lib/auth-session-from-request";

export type AdminSessionRedirectTo = "/login" | "/dashboard" | "/admin/deals";

export type EnsureAdminSessionResult =
  | { tag: "redirect"; to: AdminSessionRedirectTo }
  | { tag: "ok"; userId: string };

/**
 * Server-only guard for admin server functions and API routes.
 */
export async function ensureAdminSession(): Promise<EnsureAdminSessionResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  if (session.user.role !== "admin") {
    return { tag: "redirect", to: "/dashboard" };
  }
  return { tag: "ok", userId: session.user.id };
}

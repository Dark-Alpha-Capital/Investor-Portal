import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { ensureAdminSession } from "@/lib/auth/ensure-admin-session";

/**
 * Function middleware for admin-only `createServerFn` handlers.
 * Throws `redirect` when the user is not authenticated or not an admin.
 */
export const adminOnlyServerFnMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const g = await ensureAdminSession();
  if (g.tag === "redirect") {
    throw redirect({ to: g.to });
  }
  return next({ context: { adminUserId: g.userId } });
});

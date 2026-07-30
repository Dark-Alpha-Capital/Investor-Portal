/**
 * Resolve the Better Auth base URL.
 * In the browser, always use the current origin so production builds
 * never call localhost when VITE_PUBLIC_BETTER_AUTH_URL was missing at build time.
 */
export function getAuthBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.BETTER_AUTH_URL ??
    import.meta.env.VITE_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

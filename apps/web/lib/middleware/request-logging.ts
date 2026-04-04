import { createMiddleware } from "@tanstack/react-start";

/**
 * Request-scoped id + dev logging for SSR, server routes, and server functions.
 */
export const requestLoggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();
    const url = new URL(request.url);
    const started = Date.now();
    const result = await next({ context: { requestId } });
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[${requestId}] ${request.method} ${url.pathname} +${Date.now() - started}ms`,
      );
    }
    return result;
  },
);

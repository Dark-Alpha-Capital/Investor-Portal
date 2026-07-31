import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/auth";

function isAuthError(
  error: unknown,
): error is {
  name?: string;
  message?: string;
  status?: string | number;
  statusCode?: number;
  body?: { code?: string; message?: string };
} {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; statusCode?: number; status?: unknown };
  return (
    e.name === "APIError" ||
    typeof e.statusCode === "number" ||
    typeof e.status === "string" ||
    typeof e.status === "number"
  );
}

function statusFromAuthError(error: {
  status?: string | number;
  statusCode?: number;
}): number {
  if (typeof error.statusCode === "number") return error.statusCode;
  if (typeof error.status === "number") return error.status;

  switch (error.status) {
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "TOO_MANY_REQUESTS":
      return 429;
    default:
      return 500;
  }
}

function authErrorResponse(error: {
  message?: string;
  status?: string | number;
  statusCode?: number;
  body?: { code?: string; message?: string };
}): Response {
  const status = statusFromAuthError(error);
  const message =
    error.body?.message ?? error.message ?? "Authentication failed";
  const code =
    error.body?.code ??
    (typeof message === "string"
      ? message.toUpperCase().replace(/ /g, "_").replace(/[^A-Z0-9_]/g, "")
      : "AUTH_ERROR");

  return Response.json({ code, message }, { status });
}

const handler = async ({ request }: { request: Request }) => {
  try {
    return await auth.handler(request);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("[api/auth] Unexpected handler error:", error);
    return Response.json(
      {
        code: "INTERNAL_ERROR",
        message: "Authentication request failed. Please try again.",
      },
      { status: 500 },
    );
  }
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});

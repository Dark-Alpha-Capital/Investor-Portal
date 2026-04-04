import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/auth";

const handler = async ({ request }: { request: Request }) =>
  auth.handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});

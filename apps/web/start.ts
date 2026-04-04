import { createStart } from "@tanstack/react-start";
import { requestLoggingMiddleware } from "@/lib/middleware/request-logging";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware],
}));

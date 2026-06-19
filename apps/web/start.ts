import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { requestLoggingMiddleware } from "@/lib/middleware/request-logging";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, requestLoggingMiddleware],
}));

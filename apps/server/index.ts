import { Hono } from "hono";
import health from "./routes/health.ts";
import onboardingSubmit from "./routes/onboarding-submit.ts";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import "dotenv/config";

const app = new Hono()
  .use(logger())
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  )
  .get("/", (c) => c.json({ message: "Hello World" }))
  .route("/api/health", health)
  .route("/api/onboarding/submit", onboardingSubmit);

export default {
  port: parseInt(process.env.PORT || "8080"),
  fetch: app.fetch,
};

export type AppType = typeof app;

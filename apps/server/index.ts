import { Hono } from "hono";
import health from "./routes/health.ts";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono()
  .use(logger())
  .use(
    cors({
      origin: ["https://investor-portal.dev", "http://localhost:3000", "https://investors.darkalphacapital.com"],
      credentials: true,
    })
  )
  .get("/", (c) => c.json({ message: "Hello World" }))
  .route("/api/health", health)


export default {
  port: parseInt(process.env.PORT || "8080"),
  fetch: app.fetch,
};

export type AppType = typeof app;

import { Hono } from "hono";
import health from "./routes/health.ts";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";

const app = new Hono()
  .use(logger())
  .use(
    cors({
      origin: ["https://investor-portal.dev", "http://localhost:3000", "https://investors.darkalphacapital.com"],
      credentials: true,
    })
  )
  .get("/", (c) => c.json({ message: "Hello World" }))
  .get("/api/users", async (c) => {
    try {
      const users = await db.select().from(user).limit(2)
      return c.json({ users })
    } catch (error) {
      return c.json({ error: "Failed to get users" }, 500)
    }
  })
  .route("/api/health", health)


export default {
  port: parseInt(process.env.PORT || "8080"),
  fetch: app.fetch,
};

export type AppType = typeof app;

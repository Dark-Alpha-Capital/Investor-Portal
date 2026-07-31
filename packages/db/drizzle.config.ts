import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DRIZZLE_DB_URL;

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  ...(dbUrl ? { dbCredentials: { url: dbUrl } } : {}),
});

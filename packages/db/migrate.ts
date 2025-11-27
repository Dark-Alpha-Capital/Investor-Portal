import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("POSTGRES_URL or DATABASE_URL is not defined");
  }

  const connection = postgres(databaseUrl, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  // Verify the migration was applied
  try {
    const result = await connection`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_document' 
      AND column_name = 'status'
    `;

    if (result.length > 0) {
      console.log(
        "✅ Verified: 'status' column exists in onboarding_document table"
      );
    } else {
      console.warn("⚠️  Warning: 'status' column not found after migration");
    }
  } catch (err) {
    console.warn("⚠️  Could not verify migration:", err);
  }

  await connection.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});

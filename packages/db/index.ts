import { drizzle } from "drizzle-orm/node-postgres";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import {
  user,
  session,
  account,
  verification,
  onboarding,
  onboardingDocument,
  deal,
  dealInvite,
  dealInterest,
  investment,
  investmentDocument,
} from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL environment variable is not set"
  );
}

// Create a pg Pool for Better Auth Kysely connection
// This pool can be shared with auth.ts to avoid duplicate connections
export const pool = new Pool({
  connectionString: databaseUrl,
});

const dialect = new PostgresDialect({
  pool,
});

export const dbClient = new Kysely<any>({
  dialect,
});

// Drizzle database instance
export const db = drizzle(pool, {
  schema: {
    user,
    session,
    account,
    verification,
    onboarding,
    onboardingDocument,
    deal,
    dealInvite,
    dealInterest,
    investment,
    investmentDocument,
  },
});

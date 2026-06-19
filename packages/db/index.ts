import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export {
  eq,
  and,
  or,
  sql,
  asc,
  desc,
  inArray,
  count,
  gte,
  lte,
} from "drizzle-orm";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const db = drizzle(env.DB, { schema });
export type Db = typeof db;

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { investment } from "@repo/db/schema";

type Db = DrizzleD1Database<Record<string, unknown>>;

export async function assertCanAccessInvestment(
  db: Db,
  investmentId: string,
  userId: string,
  isAdmin: boolean
): Promise<typeof investment.$inferSelect> {
  const [row] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, investmentId))
    .limit(1);

  if (!row) {
    throw new Error("Investment not found");
  }

  if (!isAdmin && row.userId !== userId) {
    throw new Error("Forbidden");
  }

  return row;
}

export async function findInvestmentForUserDeal(
  db: Db,
  dealId: string,
  userId: string
) {
  const [row] = await db
    .select()
    .from(investment)
    .where(and(eq(investment.dealId, dealId), eq(investment.userId, userId)))
    .limit(1);
  return row ?? null;
}

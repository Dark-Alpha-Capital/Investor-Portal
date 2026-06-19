import type { Db } from "@repo/db";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { sideEffectOutbox } from "@repo/db/schema";
import type { QueuePayload } from "./side-effect-payload";
import { publishOutboxPointer } from "./queues/publish";

const MAX_DISPATCH_ATTEMPTS = 5;

export async function dispatchPendingOutbox(
  db: Db,
  batchSize = 25,
): Promise<void> {
  const candidates = await db
    .select({
      id: sideEffectOutbox.id,
      payload: sideEffectOutbox.payload,
      status: sideEffectOutbox.status,
    })
    .from(sideEffectOutbox)
    .where(
      and(
        inArray(sideEffectOutbox.status, ["pending", "failed"]),
        lt(sideEffectOutbox.attempts, MAX_DISPATCH_ATTEMPTS),
      ),
    )
    .orderBy(asc(sideEffectOutbox.createdAt))
    .limit(batchSize);

  for (const candidate of candidates) {
    const [claimed] = await db
      .update(sideEffectOutbox)
      .set({
        status: "processing",
        attempts: sql`${sideEffectOutbox.attempts} + 1`,
        lastError: null,
      })
      .where(
        and(
          eq(sideEffectOutbox.id, candidate.id),
          inArray(sideEffectOutbox.status, ["pending", "failed"]),
        ),
      )
      .returning({ id: sideEffectOutbox.id, payload: sideEffectOutbox.payload });

    if (!claimed) continue;

    const payload = claimed.payload as QueuePayload;

    try {
      if (payload.queue === "onboarding") {
        await env.ONBOARDING_KYC_WORKFLOW.create({
          id: payload.jobId,
          params: { outboxId: claimed.id },
        });
      } else if (payload.queue === "email") {
        await publishOutboxPointer(env.OUTBOUND_EMAIL_QUEUE, claimed.id);
      } else if (payload.queue === "deal") {
        await publishOutboxPointer(env.DEAL_FOLDER_QUEUE, claimed.id);
      } else {
        throw new Error(`Unsupported outbox queue type: ${payload.queue}`);
      }

      await db
        .update(sideEffectOutbox)
        .set({
          status: "dispatched",
          dispatchedAt: new Date(),
          lastError: null,
        })
        .where(eq(sideEffectOutbox.id, claimed.id));
    } catch (error) {
      await db
        .update(sideEffectOutbox)
        .set({
          status: "failed",
          lastError:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : "Unknown dispatch failure",
        })
        .where(eq(sideEffectOutbox.id, claimed.id));
    }
  }
}

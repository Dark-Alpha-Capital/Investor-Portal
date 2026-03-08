import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { sideEffectOutbox } from "@repo/db/schema";
import { dealQueue, emailQueue, onboardingQueue } from "@/lib/redis";

type QueuePayload = {
  queue: "deal" | "onboarding" | "email";
  jobName: string;
  jobId: string;
  data: Record<string, unknown>;
};

const OUTBOX_DISPATCH_JOB_OPTIONS = {
  removeOnComplete: {
    age: 24 * 3600,
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600,
  },
} as const;

const MAX_DISPATCH_ATTEMPTS = 5;

export async function dispatchPendingOutbox(
  db: PostgresJsDatabase,
  batchSize = 25
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
        lt(sideEffectOutbox.attempts, MAX_DISPATCH_ATTEMPTS)
      )
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
          inArray(sideEffectOutbox.status, ["pending", "failed"])
        )
      )
      .returning({ id: sideEffectOutbox.id, payload: sideEffectOutbox.payload });

    if (!claimed) continue;

    const payload = claimed.payload as QueuePayload;

    try {
      if (payload.queue === "deal") {
        await dealQueue.add(payload.jobName, payload.data, {
          ...OUTBOX_DISPATCH_JOB_OPTIONS,
          jobId: payload.jobId,
        });
      } else if (payload.queue === "onboarding") {
        await onboardingQueue.add(payload.jobName, payload.data, {
          ...OUTBOX_DISPATCH_JOB_OPTIONS,
          jobId: payload.jobId,
        });
      } else if (payload.queue === "email") {
        await emailQueue.add(payload.jobName, payload.data, {
          ...OUTBOX_DISPATCH_JOB_OPTIONS,
          jobId: payload.jobId,
        });
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

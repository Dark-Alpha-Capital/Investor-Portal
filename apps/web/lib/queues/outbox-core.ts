import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { sideEffectOutbox } from "@repo/db/schema";
import type { Db } from "@repo/db";
import type { QueuePayload } from "./side-effect-payload";

const MAX_DISPATCH_ATTEMPTS = 5;

/** Injectable dispatch targets — the test seam for the claim→dispatch cycle. */
export type DispatchTargets = {
  email: (outboxId: string) => Promise<void>;
  deal: (outboxId: string) => Promise<void>;
  onboarding: (outboxId: string, payload: QueuePayload) => Promise<void>;
};

/**
 * Claim pending/failed outbox rows and dispatch them via the injected targets.
 * Pure logic — no Cloudflare bindings — so the claim→dispatch→ack cycle is
 * unit-testable with a stubbed db + fake targets.
 */
export async function dispatchOutboxCandidates(
  db: Db,
  targets: DispatchTargets,
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

  console.log(`[Outbox] dispatching ${candidates.length} candidate(s)`);

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
        await targets.onboarding(claimed.id, payload);
      } else if (payload.queue === "email") {
        await targets.email(claimed.id);
      } else if (payload.queue === "deal") {
        await targets.deal(claimed.id);
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

      console.log(
        `[Outbox] dispatched outboxId=${claimed.id} queue=${payload.queue} jobId=${payload.jobId}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "Unknown dispatch failure";
      console.error(
        `[Outbox] dispatch failed outboxId=${claimed.id} queue=${payload.queue} jobId=${payload.jobId}: ${message}`,
        error,
      );
      await db
        .update(sideEffectOutbox)
        .set({
          status: "failed",
          lastError: message,
        })
        .where(eq(sideEffectOutbox.id, claimed.id));
    }
  }
}

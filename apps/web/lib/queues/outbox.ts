import type { Db } from "@repo/db";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { sideEffectOutbox } from "@repo/db/schema";
import type { QueuePayload } from "./side-effect-payload";
import { publishOutboxPointer } from "./publish";

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

  console.log(
    `[Outbox] dispatching ${candidates.length} candidate(s)`,
  );

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
        console.log(
          `[Outbox] creating ONBOARDING_KYC_WORKFLOW id=${payload.jobId} outboxId=${claimed.id}`,
        );
        const instance = await env.ONBOARDING_KYC_WORKFLOW.create({
          id: payload.jobId,
          params: { outboxId: claimed.id },
        });
        // Ensure local workflow init finishes before the request ends.
        const status = await instance.status();
        console.log(
          `[Outbox] workflow created id=${instance.id} status=${status.status}`,
        );
      } else if (payload.queue === "email") {
        console.log(
          `[Outbox] publishing email queue jobId=${payload.jobId} outboxId=${claimed.id}`,
        );
        await publishOutboxPointer(env.OUTBOUND_EMAIL_QUEUE, claimed.id);
      } else if (payload.queue === "deal") {
        console.log(
          `[Outbox] publishing deal queue jobId=${payload.jobId} outboxId=${claimed.id}`,
        );
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

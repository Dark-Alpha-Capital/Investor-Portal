import type { Db } from "@repo/db";
import { env } from "cloudflare:workers";
import type { QueuePayload } from "./side-effect-payload";
import { publishOutboxPointer } from "./publish";
import {
  dispatchOutboxCandidates,
  type DispatchTargets,
} from "./outbox-core";

export type { DispatchTargets } from "./outbox-core";

/**
 * Production dispatch wiring — maps an outbox row to its Cloudflare target.
 * Injectable so tests can stub the claim→dispatch→ack cycle.
 */
export function defaultDispatchTargets(env: Env): DispatchTargets {
  return {
    async onboarding(outboxId: string, payload: QueuePayload) {
      console.log(
        `[Outbox] creating ONBOARDING_KYC_WORKFLOW id=${payload.jobId} outboxId=${outboxId}`,
      );
      const instance = await env.ONBOARDING_KYC_WORKFLOW.create({
        id: payload.jobId,
        params: { outboxId },
      });
      const status = await instance.status();
      console.log(
        `[Outbox] workflow created id=${instance.id} status=${status.status}`,
      );
    },
    async email(outboxId: string) {
      console.log(`[Outbox] publishing email queue outboxId=${outboxId}`);
      await publishOutboxPointer(env.OUTBOUND_EMAIL_QUEUE, outboxId);
    },
    async deal(outboxId: string) {
      console.log(`[Outbox] publishing deal queue outboxId=${outboxId}`);
      await publishOutboxPointer(env.DEAL_FOLDER_QUEUE, outboxId);
    },
  };
}

/**
 * Claim pending/failed outbox rows and dispatch them. `targets` defaults to the
 * production Cloudflare wiring; pass your own to test.
 */
export async function dispatchPendingOutbox(
  db: Db,
  batchSize = 25,
  targets?: DispatchTargets,
): Promise<void> {
  return dispatchOutboxCandidates(db, targets ?? defaultDispatchTargets(env), batchSize);
}
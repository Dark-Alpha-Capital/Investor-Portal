import { NonRetryableError } from "cloudflare:workflows";
import {
  DEAL_FOLDER_QUEUE_NAME,
  OUTBOUND_EMAIL_QUEUE_NAME,
  type OutboxPointerMessage,
} from "./queue-config";
import {
  assertDealFolderPayload,
  assertOutboundEmailPayload,
  fetchOutboxQueuePayload,
} from "../workflows/workflow-outbox";
import { runOutboundEmailSend } from "../handlers/outbound-email-send";
import { runDealFolderSync } from "../handlers/deal-folder-sync";
import { markOutboxSettled } from "../workflows/workflow-outbox";
import type { EmailJobData } from "@repo/mail";

async function processEmailOutbox(outboxId: string): Promise<void> {
  const payload = await fetchOutboxQueuePayload(outboxId);
  assertOutboundEmailPayload(payload);
  await runOutboundEmailSend(payload.data as unknown as EmailJobData, {
    idempotencyKey: outboxId,
  });
}

async function processDealFolderOutbox(outboxId: string): Promise<void> {
  const payload = await fetchOutboxQueuePayload(outboxId);
  assertDealFolderPayload(payload);
  await runDealFolderSync(payload.jobName, payload.data);
}

/** Exponential backoff in seconds: 30s, 60s, 120s, … capped at 900s (15 min). */
function retryDelayMs(attempt: number): number {
  const delaySeconds = Math.min(30 * 2 ** (attempt - 1), 900);
  return delaySeconds * 1000;
}

/**
 * Cloudflare Queues consumer: one Worker can serve multiple queues; route by `batch.queue`.
 * Per-message ack/retry so one failure does not force the whole batch to retry.
 */
export async function handleAsyncJobQueue(
  batch: MessageBatch<OutboxPointerMessage>,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const isEmail = batch.queue === OUTBOUND_EMAIL_QUEUE_NAME;
  const isDeal = batch.queue === DEAL_FOLDER_QUEUE_NAME;

  if (!isEmail && !isDeal) {
    console.warn(`[queues] Ignoring unknown queue: ${batch.queue}`);
    return;
  }

  const run = isEmail ? processEmailOutbox : processDealFolderOutbox;

  for (const message of batch.messages) {
    const { outboxId } = message.body;
    if (!outboxId) {
      console.error("[queues] Missing outboxId in message body");
      message.ack();
      continue;
    }

    try {
      await run(outboxId);
      await markOutboxSettled(outboxId, "sent");
      message.ack();
    } catch (err) {
      if (err instanceof NonRetryableError) {
        console.error(
          `[queues] Non-retryable failure queue=${batch.queue} outboxId=${outboxId}:`,
          err.message,
        );
        await markOutboxSettled(outboxId, "failed", err.message);
        message.ack();
        continue;
      }
      const attempt = message.attempts ?? 1;
      console.error(
        `[queues] Retry queue=${batch.queue} outboxId=${outboxId} attempt=${attempt}:`,
        err,
      );
      message.retry({ delaySeconds: retryDelayMs(attempt) / 1000 });
    }
  }
}

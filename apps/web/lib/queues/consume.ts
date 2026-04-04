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
} from "../workflow-outbox";
import { runOutboundEmailSend } from "../handlers/outbound-email-send";
import { runDealFolderSync } from "../handlers/deal-folder-sync";
import type { EmailJobData } from "@repo/mail";

async function processEmailOutbox(outboxId: string): Promise<void> {
  const payload = await fetchOutboxQueuePayload(outboxId);
  assertOutboundEmailPayload(payload);
  await runOutboundEmailSend(payload.data as unknown as EmailJobData);
}

async function processDealFolderOutbox(outboxId: string): Promise<void> {
  const payload = await fetchOutboxQueuePayload(outboxId);
  assertDealFolderPayload(payload);
  await runDealFolderSync(payload.jobName, payload.data);
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
      message.ack();
    } catch (err) {
      if (err instanceof NonRetryableError) {
        console.error(
          `[queues] Non-retryable failure queue=${batch.queue} outboxId=${outboxId}:`,
          err.message,
        );
        message.ack();
        continue;
      }
      console.error(
        `[queues] Retry queue=${batch.queue} outboxId=${outboxId}:`,
        err,
      );
      message.retry({ delaySeconds: 10 });
    }
  }
}

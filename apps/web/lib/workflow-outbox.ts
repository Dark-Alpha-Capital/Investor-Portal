import { NonRetryableError } from "cloudflare:workflows";
import { db } from "@repo/db";
import { sideEffectOutbox } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import type { QueuePayload } from "./side-effect-payload";

export async function fetchOutboxQueuePayload(
  outboxId: string,
): Promise<QueuePayload> {
  const rows = await db
    .select({ payload: sideEffectOutbox.payload })
    .from(sideEffectOutbox)
    .where(eq(sideEffectOutbox.id, outboxId))
    .limit(1);
  const row = rows[0];
  if (!row?.payload) {
    throw new NonRetryableError(`Outbox row not found: ${outboxId}`);
  }
  return structuredClone(row.payload) as QueuePayload;
}

export function assertOnboardingKycPayload(p: QueuePayload): void {
  if (
    p.queue !== "onboarding" ||
    p.jobName !== "upload-onboarding-files"
  ) {
    throw new NonRetryableError(
      `OnboardingKycWorkflow: expected onboarding/upload-onboarding-files, got queue=${p.queue} job=${p.jobName}`,
    );
  }
}

export function assertOutboundEmailPayload(p: QueuePayload): void {
  if (p.queue !== "email") {
    throw new NonRetryableError(
      `email queue consumer: expected queue=email, got ${p.queue}`,
    );
  }
}

export function assertDealFolderPayload(p: QueuePayload): void {
  if (p.queue !== "deal") {
    throw new NonRetryableError(
      `deal-folder queue consumer: expected queue=deal, got ${p.queue}`,
    );
  }
}

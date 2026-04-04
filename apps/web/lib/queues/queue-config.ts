/** Cloudflare Queue names — must match wrangler.jsonc `queues.*.queue` values. */
export const OUTBOUND_EMAIL_QUEUE_NAME = "dac-outbound-email";
export const DEAL_FOLDER_QUEUE_NAME = "dac-deal-folder-sync";

/** Message body: full job payload stays in Postgres; queue only carries the outbox row id (< 128 KB limit). */
export type OutboxPointerMessage = {
  outboxId: string;
};

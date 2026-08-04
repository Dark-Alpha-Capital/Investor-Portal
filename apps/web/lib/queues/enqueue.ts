import { randomUUID } from "crypto";
import type { Db } from "@repo/db";
import { sideEffectOutbox } from "@repo/db/schema";
import type { QueuePayload } from "./side-effect-payload";
import { dispatchPendingOutbox, type DispatchTargets } from "./outbox";

export type { DispatchTargets } from "./outbox";

export type EnqueueRow = {
  topic?: string;
  dedupeKey: string;
  payload: QueuePayload;
};

/**
 * Insert outbox rows and dispatch them. The single seam for every queued
 * side-effect (email / deal-folder sync / onboarding workflow).
 */
export async function enqueueSideEffect(
  db: Db,
  rows: EnqueueRow[],
  targets?: DispatchTargets,
): Promise<void> {
  if (rows.length === 0) return;

  await db.insert(sideEffectOutbox).values(
    rows.map((row) => ({
      id: randomUUID(),
      topic: row.topic ?? "queue",
      dedupeKey: row.dedupeKey,
      payload: row.payload,
    })),
  );

  await dispatchPendingOutbox(db, 25, targets);
}

/** Enqueue one or more email jobs. */
export async function enqueueEmail<TData extends object>(
  db: Db,
  rows: Array<{
    jobName: string;
    jobId: string;
    dedupeKey: string;
    data: TData;
  }>,
  targets?: DispatchTargets,
): Promise<void> {
  return enqueueSideEffect(
    db,
    rows.map((row) => ({
      dedupeKey: row.dedupeKey,
      payload: {
        queue: "email" as const,
        jobName: row.jobName,
        jobId: row.jobId,
        data: row.data as Record<string, unknown>,
      },
    })),
    targets,
  );
}

/** Enqueue one or more deal-folder sync jobs. */
export async function enqueueDeal<TData extends object>(
  db: Db,
  rows: Array<{
    jobName: string;
    jobId: string;
    dedupeKey: string;
    data: TData;
  }>,
  targets?: DispatchTargets,
): Promise<void> {
  return enqueueSideEffect(
    db,
    rows.map((row) => ({
      dedupeKey: row.dedupeKey,
      payload: {
        queue: "deal" as const,
        jobName: row.jobName,
        jobId: row.jobId,
        data: row.data as Record<string, unknown>,
      },
    })),
    targets,
  );
}

/** Enqueue an onboarding workflow job (KYC file upload). */
export async function enqueueOnboarding<TData extends object>(
  db: Db,
  row: {
    jobName: string;
    jobId: string;
    dedupeKey: string;
    data: TData;
  },
  targets?: DispatchTargets,
): Promise<void> {
  return enqueueSideEffect(
    db,
    [
      {
        dedupeKey: row.dedupeKey,
        payload: {
          queue: "onboarding" as const,
          jobName: row.jobName,
          jobId: row.jobId,
          data: row.data as Record<string, unknown>,
        },
      },
    ],
    targets,
  );
}

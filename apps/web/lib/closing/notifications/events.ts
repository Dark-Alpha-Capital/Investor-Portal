import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Db as RepoDb } from "@repo/db";
import {
  deal,
  investment,
  investmentClosingEvent,
  signatureRequest,
  subscriptionDocument,
  subscriptionPackage,
  user,
} from "@repo/db/schema";
import {
  SUBSCRIPTION_DOCUMENT_TYPE_LABELS,
  type ClosingEventType,
} from "@repo/db/investment-closing";
import type {
  ClosingCommitmentCreatedJobData,
  EmailJobData,
  EmailJobType,
} from "@repo/mail";
import { EMAIL_CONFIG } from "@repo/mail";
import { listAdminUserEmails } from "@repo/db/queries";
import { enqueueEmail } from "@/lib/queues/enqueue";

type Db = DrizzleD1Database<Record<string, unknown>>;

/**
 * Lifecycle moments that map to a real investor email.
 * Everything else stays audit-only (viewing, downloads, generation, etc.).
 */
export type ClosingNotificationEvent =
  | "commitment_created"
  | "documents_ready"
  | "package_sent"
  | "documents_executed"
  | "funds_received"
  | "investment_closed";

export type ClosingNotificationPayload = {
  investmentId: string;
  dealId?: string;
  userId?: string;
  [key: string]: unknown;
};

/**
 * Notification port — inserts an audit row for every event, and for the three
 * investor-facing milestones also enqueues a real Resend email via the outbox.
 */
export interface ClosingNotificationPort {
  emit(
    event: ClosingNotificationEvent,
    payload: ClosingNotificationPayload,
    actorUserId?: string | null
  ): Promise<void>;
}

const NOTIFICATION_TO_CLOSING_EVENT: Record<
  ClosingNotificationEvent,
  ClosingEventType
> = {
  commitment_created: "commitment_created",
  documents_ready: "package_generated",
  package_sent: "signature_requested",
  documents_executed: "package_fully_signed",
  funds_received: "funds_received",
  investment_closed: "investment_closed",
};

const NOTIFICATION_TO_EMAIL_JOB: Record<
  ClosingNotificationEvent,
  EmailJobType | null
> = {
  commitment_created: "closing-commitment-created", // admin notification
  documents_ready: null, // generation is internal — investor hears about it on send
  package_sent: "closing-package-sent",
  documents_executed: "closing-documents-executed",
  funds_received: "closing-funds-received",
  investment_closed: null,
};

function formatMoney(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(num)) return "";
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Investor-facing per-document signing links for the package-sent email. */
async function buildSigningLinkList(
  db: Db,
  investmentId: string
): Promise<Array<{ documentName: string; signingUrl: string }>> {
  const rows = await db
    .select({
      documentType: subscriptionDocument.documentType,
      metadata: signatureRequest.metadata,
    })
    .from(signatureRequest)
    .innerJoin(
      subscriptionDocument,
      eq(subscriptionDocument.id, signatureRequest.documentId)
    )
    .innerJoin(
      subscriptionPackage,
      eq(subscriptionPackage.id, subscriptionDocument.packageId)
    )
    .where(
      and(
        eq(subscriptionPackage.investmentId, investmentId),
        eq(signatureRequest.signerRole, "investor")
      )
    );

  return rows
    .map((row) => {
      const signingUrl =
        (row.metadata as Record<string, unknown> | null)?.signingUrl;
      if (typeof signingUrl !== "string" || !signingUrl) return null;
      return {
        documentName:
          SUBSCRIPTION_DOCUMENT_TYPE_LABELS[row.documentType] ?? row.documentType,
        signingUrl,
      };
    })
    .filter((d): d is { documentName: string; signingUrl: string } => d !== null);
}

async function enqueueClosingEmail(
  db: Db,
  event: ClosingNotificationEvent,
  payload: ClosingNotificationPayload
): Promise<void> {
  const jobType = NOTIFICATION_TO_EMAIL_JOB[event];
  if (!jobType) return;

  const [inv] = await db
    .select({
      dealId: investment.dealId,
      userId: investment.userId,
      entityName: investment.entityName,
      committedAmount: investment.committedAmount,
    })
    .from(investment)
    .where(eq(investment.id, payload.investmentId))
    .limit(1);
  if (!inv) return;

  const [[dealRow], [userRow]] = await Promise.all([
    db
      .select({ name: deal.name })
      .from(deal)
      .where(eq(deal.id, inv.dealId))
      .limit(1),
    db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, inv.userId))
      .limit(1),
  ]);

  // New commitment → notify the firm's admins so they can prepare the package.
  if (jobType === "closing-commitment-created") {
    const adminRecipients = await listAdminUserEmails();
    const tos = new Set<string>(
      adminRecipients.map((a) => a.email).filter(Boolean),
    );
    tos.add(process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_CONFIG.defaultAdminEmail);

    const jobs = [...tos].map((to) => {
      const data: ClosingCommitmentCreatedJobData = {
        type: "closing-commitment-created",
        to,
        investorName: userRow?.name ?? "Investor",
        investorEmail: userRow?.email ?? "",
        dealName: dealRow?.name ?? "the Fund",
        committedAmount: formatMoney(inv.committedAmount),
      };
      return {
        dedupeKey: `${jobType}:${payload.investmentId}:${to}`,
        jobName: jobType,
        jobId: `${jobType}-${payload.investmentId}-${to}`,
        data,
      };
    });
    if (jobs.length > 0) await enqueueEmail(db as unknown as RepoDb, jobs);
    return;
  }

  if (!userRow?.email) return;

  const data: EmailJobData = {
    type: jobType,
    to: userRow.email,
    investorName: userRow.name ?? "Investor",
    dealName: dealRow?.name ?? "the Fund",
    ...(jobType === "closing-funds-received"
      ? { committedAmount: formatMoney(inv.committedAmount) }
      : {}),
    ...(jobType === "closing-package-sent"
      ? { documents: await buildSigningLinkList(db, payload.investmentId) }
      : {}),
  } as EmailJobData;

  const jobId = `${jobType}-${payload.investmentId}`;
  await enqueueEmail(db as unknown as RepoDb, [
    {
      dedupeKey: `${jobType}:${payload.investmentId}`,
      jobName: jobType,
      jobId,
      data,
    },
  ]);
}

export function createClosingNotificationPort(db: Db): ClosingNotificationPort {
  return {
    async emit(event, payload, actorUserId = null) {
      await db.insert(investmentClosingEvent).values({
        id: randomUUID(),
        investmentId: payload.investmentId,
        eventType: "notification_emitted",
        actorUserId,
        payload: {
          notificationEvent: event,
          domainEvent: NOTIFICATION_TO_CLOSING_EVENT[event],
          outboxTopic: "closing.notification",
          ...payload,
        },
      });

      try {
        await enqueueClosingEmail(db, event, payload);
      } catch (error) {
        console.error(
          `[closing] failed to enqueue ${event} email for investment=${payload.investmentId}`,
          error,
        );
      }
    },
  };
}

/** Map lifecycle moments to notification events (used by services). */
export function notificationForStatus(
  toStatus: string
): ClosingNotificationEvent | null {
  switch (toStatus) {
    case "documents_generated":
      return "documents_ready";
    case "awaiting_signature":
      return "package_sent";
    case "awaiting_funds":
      return "documents_executed";
    case "funded":
      return "funds_received";
    case "closed":
      return "investment_closed";
    default:
      return null;
  }
}

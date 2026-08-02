import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  documentTemplate,
  investment,
  investmentClosingEvent,
  investmentStatusHistory,
  onboarding,
  subscriptionDocument,
  subscriptionPackage,
  user,
} from "@repo/db/schema";
import {
  SUBSCRIPTION_DOCUMENT_TYPES,
  type ClosingEventType,
  type InvestmentClosingStatus,
  type TransitionActor,
} from "@repo/db/investment-closing";
import { requireTransition } from "../state-machine";
import {
  createClosingNotificationPort,
  notificationForStatus,
} from "../notifications/events";
import type { CreateCommitmentInput } from "../types";

type Db = DrizzleD1Database<Record<string, unknown>>;

export async function appendClosingEvent(
  db: Db,
  input: {
    investmentId: string;
    eventType: ClosingEventType;
    actorUserId?: string | null;
    payload?: Record<string, unknown> | null;
  }
) {
  await db.insert(investmentClosingEvent).values({
    id: randomUUID(),
    investmentId: input.investmentId,
    eventType: input.eventType,
    actorUserId: input.actorUserId ?? null,
    payload: input.payload ?? null,
  });
}

export async function transitionInvestmentStatus(
  db: Db,
  input: {
    investmentId: string;
    toStatus: InvestmentClosingStatus;
    actor: TransitionActor;
    actorUserId?: string | null;
    reason?: string;
    emitNotification?: boolean;
    dealId?: string;
    investorUserId?: string;
  }
) {
  const [row] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, input.investmentId))
    .limit(1);

  if (!row) {
    throw new Error("Investment not found");
  }

  requireTransition(row.status, input.toStatus, input.actor);

  const [updated] = await db
    .update(investment)
    .set({ status: input.toStatus })
    .where(eq(investment.id, input.investmentId))
    .returning();

  await db.insert(investmentStatusHistory).values({
    id: randomUUID(),
    investmentId: input.investmentId,
    fromStatus: row.status,
    toStatus: input.toStatus,
    changedBy: input.actorUserId ?? null,
    reason: input.reason ?? null,
  });

  await appendClosingEvent(db, {
    investmentId: input.investmentId,
    eventType: "status_changed",
    actorUserId: input.actorUserId,
    payload: {
      fromStatus: row.status,
      toStatus: input.toStatus,
      reason: input.reason ?? null,
    },
  });

  if (input.emitNotification !== false) {
    const notification = notificationForStatus(input.toStatus);
    if (notification) {
      const port = createClosingNotificationPort(db);
      await port.emit(
        notification,
        {
          investmentId: input.investmentId,
          dealId: input.dealId ?? row.dealId,
          userId: input.investorUserId ?? row.userId,
          toStatus: input.toStatus,
        },
        input.actorUserId
      );
    }
  }

  return updated;
}

async function seedPackageDocuments(
  db: Db,
  packageId: string
): Promise<number> {
  const templates = await db
    .select()
    .from(documentTemplate)
    .where(eq(documentTemplate.isActive, true));

  const byType = new Map(templates.map((t) => [t.documentType, t]));

  const rows = SUBSCRIPTION_DOCUMENT_TYPES.map((documentType) => {
    const template = byType.get(documentType);
    return {
      id: randomUUID(),
      packageId,
      templateId: template?.id ?? null,
      documentType,
      version: template?.version ?? 1,
      status: "not_generated" as const,
      signatureRequired: template?.signatureRequired ?? documentType !== "wire_instructions",
      requiresCountersign: template?.countersignRequired ?? documentType !== "wire_instructions",
    };
  });

  if (rows.length > 0) {
    await db.insert(subscriptionDocument).values(rows);
  }
  return rows.length;
}

export async function createCommitment(
  db: Db,
  input: CreateCommitmentInput,
  actor: { userId: string; role: TransitionActor }
) {
  if (!input.acknowledgementAccepted) {
    throw new Error("Acknowledgement is required to commit capital");
  }

  const id = randomUUID();
  const now = input.committedDate ?? new Date();
  const packageId = randomUUID();

  const [created] = await db
    .insert(investment)
    .values({
      id,
      dealId: input.dealId,
      userId: input.userId,
      committedAmount: input.committedAmount,
      committedDate: now,
      fundedAmount: 0,
      status: "draft",
      ownershipPercentage: input.ownershipPercentage ?? null,
      entityName: input.entityName,
      entityType: input.entityType,
      acknowledgementAcceptedAt: now,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  await db.insert(investmentStatusHistory).values({
    id: randomUUID(),
    investmentId: id,
    fromStatus: null,
    toStatus: "draft",
    changedBy: actor.userId,
    reason: "Commitment created",
  });

  await appendClosingEvent(db, {
    investmentId: id,
    eventType: "commitment_created",
    actorUserId: actor.userId,
    payload: {
      committedAmount: input.committedAmount,
      entityName: input.entityName,
      entityType: input.entityType,
    },
  });

  await db.insert(subscriptionPackage).values({
    id: packageId,
    investmentId: id,
    status: "pending",
  });

  await seedPackageDocuments(db, packageId);

  await appendClosingEvent(db, {
    investmentId: id,
    eventType: "package_created",
    actorUserId: actor.userId,
    payload: { packageId },
  });

  const pending = await transitionInvestmentStatus(db, {
    investmentId: id,
    toStatus: "pending_documents",
    actor: "system",
    actorUserId: actor.userId,
    reason: "Awaiting subscription document generation",
    emitNotification: false,
  });

  const notify = createClosingNotificationPort(db);
  await notify.emit(
    "commitment_created",
    {
      investmentId: id,
      dealId: input.dealId,
      userId: input.userId,
      committedAmount: input.committedAmount,
    },
    actor.userId
  );

  return { investment: pending ?? created, packageId };
}

export async function resolveEntitySnapshot(
  db: Db,
  userId: string,
  overrides?: { entityName?: string; entityType?: "individual" | "entity" }
) {
  const [[userRow], [onboardingRow]] = await Promise.all([
    db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
    db
      .select({
        organizationName: onboarding.organizationName,
        legalEntityType: onboarding.legalEntityType,
        primaryContactName: onboarding.primaryContactName,
      })
      .from(onboarding)
      .where(eq(onboarding.userId, userId))
      .orderBy(desc(onboarding.createdAt))
      .limit(1),
  ]);

  const entityType =
    overrides?.entityType ??
    onboardingRow?.legalEntityType ??
    "individual";

  const entityName =
    overrides?.entityName?.trim() ||
    (entityType === "entity"
      ? onboardingRow?.organizationName
      : onboardingRow?.primaryContactName) ||
    userRow?.name ||
    "Investor";

  return { entityName, entityType: entityType as "individual" | "entity" };
}

export async function cancelCommitment(
  db: Db,
  investmentId: string,
  actor: { userId: string; role: TransitionActor },
  reason?: string
) {
  const updated = await transitionInvestmentStatus(db, {
    investmentId,
    toStatus: "cancelled",
    actor: actor.role,
    actorUserId: actor.userId,
    reason: reason ?? "Commitment cancelled",
  });
  await appendClosingEvent(db, {
    investmentId,
    eventType: "commitment_cancelled",
    actorUserId: actor.userId,
    payload: { reason: reason ?? null },
  });
  return updated;
}

export async function rejectCommitment(
  db: Db,
  investmentId: string,
  actorUserId: string,
  reason?: string
) {
  const updated = await transitionInvestmentStatus(db, {
    investmentId,
    toStatus: "rejected",
    actor: "admin",
    actorUserId,
    reason: reason ?? "Commitment rejected",
  });
  await appendClosingEvent(db, {
    investmentId,
    eventType: "commitment_rejected",
    actorUserId,
    payload: { reason: reason ?? null },
  });
  return updated;
}

export async function markExpired(
  db: Db,
  investmentId: string,
  actorUserId?: string | null
) {
  const updated = await transitionInvestmentStatus(db, {
    investmentId,
    toStatus: "expired",
    actor: "system",
    actorUserId: actorUserId ?? null,
    reason: "Commitment expired",
  });
  await appendClosingEvent(db, {
    investmentId,
    eventType: "commitment_expired",
    actorUserId: actorUserId ?? null,
  });
  return updated;
}

export async function recordFunding(
  db: Db,
  investmentId: string,
  fundedAmount: number,
  actorUserId: string
) {
  const [row] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, investmentId))
    .limit(1);
  if (!row) throw new Error("Investment not found");

  requireTransition(row.status, "funded", "admin");

  await db
    .update(investment)
    .set({ fundedAmount })
    .where(eq(investment.id, investmentId));

  const updated = await transitionInvestmentStatus(db, {
    investmentId,
    toStatus: "funded",
    actor: "admin",
    actorUserId,
    reason: "Funds received",
  });

  await appendClosingEvent(db, {
    investmentId,
    eventType: "funds_received",
    actorUserId,
    payload: { fundedAmount },
  });

  return updated;
}

export async function getClosingPackageForInvestment(
  db: Db,
  investmentId: string
) {
  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.investmentId, investmentId))
    .limit(1);

  if (!pkg) return null;

  const documents = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.packageId, pkg.id));

  const events = await db
    .select()
    .from(investmentClosingEvent)
    .where(eq(investmentClosingEvent.investmentId, investmentId))
    .orderBy(desc(investmentClosingEvent.createdAt));

  const history = await db
    .select()
    .from(investmentStatusHistory)
    .where(eq(investmentStatusHistory.investmentId, investmentId))
    .orderBy(desc(investmentStatusHistory.createdAt));

  return { package: pkg, documents, events, history };
}

export async function listActiveTemplates(db: Db) {
  return db
    .select()
    .from(documentTemplate)
    .where(eq(documentTemplate.isActive, true));
}

export { and, eq };

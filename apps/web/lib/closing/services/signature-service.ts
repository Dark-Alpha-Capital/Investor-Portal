import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  investment,
  signatureRequest,
  subscriptionDocument,
  subscriptionPackage,
} from "@repo/db/schema";
import { createMockSignatureProvider } from "../signatures/mock-provider";
import {
  appendClosingEvent,
  transitionInvestmentStatus,
} from "./investment-closing-service";

type Db = DrizzleD1Database<Record<string, unknown>>;

async function loadPackageContext(db: Db, investmentId: string) {
  const [inv] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, investmentId))
    .limit(1);
  if (!inv) throw new Error("Investment not found");

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.investmentId, investmentId))
    .limit(1);
  if (!pkg) throw new Error("Subscription package not found");

  const documents = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.packageId, pkg.id));

  return { inv, pkg, documents };
}

/**
 * Release the subscription package to the investor.
 * Signature docs → `sent`; informational docs (wire instructions) → `available`.
 * Emails fire via the awaiting_signature transition.
 */
export async function sendForSignature(
  db: Db,
  investmentId: string,
  actorUserId: string
) {
  const { inv, pkg, documents } = await loadPackageContext(db, investmentId);

  if (inv.status !== "documents_generated" && inv.status !== "awaiting_signature") {
    throw new Error(
      `Cannot send for signature from status "${inv.status}"`
    );
  }

  const provider = createMockSignatureProvider(db);
  const now = new Date();

  for (const doc of documents) {
    if (doc.status === "not_generated") {
      throw new Error(`Document ${doc.documentType} is not generated yet`);
    }

    if (!doc.signatureRequired) {
      await db
        .update(subscriptionDocument)
        .set({ status: "available", sentAt: now })
        .where(eq(subscriptionDocument.id, doc.id));
      continue;
    }

    await db
      .update(subscriptionDocument)
      .set({ status: "sent", sentAt: now })
      .where(eq(subscriptionDocument.id, doc.id));

    await provider.createRequest({
      documentId: doc.id,
      signerUserId: inv.userId,
      signerRole: "investor",
      metadata: { investmentId: inv.id },
    });
  }

  await db
    .update(subscriptionPackage)
    .set({ status: "sent" })
    .where(eq(subscriptionPackage.id, pkg.id));

  if (inv.status === "documents_generated") {
    await transitionInvestmentStatus(db, {
      investmentId: inv.id,
      toStatus: "awaiting_signature",
      actor: "admin",
      actorUserId,
      reason: "Subscription package sent to investor",
    });
  }

  await appendClosingEvent(db, {
    investmentId: inv.id,
    eventType: "signature_requested",
    actorUserId,
    payload: { packageId: pkg.id },
  });

  return { success: true };
}

/**
 * Telemetry only — viewing never changes a document's business state.
 * Records viewedAt / lastViewedAt / openedCount and an audit event.
 */
export async function markDocumentViewed(
  db: Db,
  documentId: string,
  actorUserId: string
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, doc.packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found");

  const now = new Date();
  await db
    .update(subscriptionDocument)
    .set({
      viewedAt: doc.viewedAt ?? now,
      lastViewedAt: now,
      openedCount: (doc.openedCount ?? 0) + 1,
    })
    .where(eq(subscriptionDocument.id, documentId));

  const provider = createMockSignatureProvider(db);
  const [req] = await db
    .select()
    .from(signatureRequest)
    .where(
      and(
        eq(signatureRequest.documentId, documentId),
        eq(signatureRequest.signerUserId, actorUserId),
        eq(signatureRequest.signerRole, "investor")
      )
    )
    .limit(1);

  if (req && (req.status === "sent" || req.status === "pending")) {
    await provider.markViewed(req.id);
  }

  await appendClosingEvent(db, {
    investmentId: pkg.investmentId,
    eventType: "document_viewed",
    actorUserId,
    payload: { documentId },
  });

  return { success: true };
}

/**
 * Telemetry only — records a download without advancing any state.
 */
export async function recordDocumentDownloaded(
  db: Db,
  documentId: string,
  actorUserId: string,
  metadata?: { userAgent?: string }
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, doc.packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found");

  const now = new Date();
  await db
    .update(subscriptionDocument)
    .set({
      downloadedAt: doc.downloadedAt ?? now,
      lastViewedAt: now,
      openedCount: (doc.openedCount ?? 0) + 1,
    })
    .where(eq(subscriptionDocument.id, documentId));

  await appendClosingEvent(db, {
    investmentId: pkg.investmentId,
    eventType: "document_downloaded",
    actorUserId,
    payload: {
      documentId,
      ...(metadata?.userAgent ? { userAgent: metadata.userAgent } : {}),
    },
  });

  return { success: true };
}

export async function signDocument(
  db: Db,
  documentId: string,
  actorUserId: string,
  isAdmin = false
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");
  if (!doc.signatureRequired) {
    throw new Error("This document does not require a signature");
  }

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, doc.packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found");

  const [inv] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, pkg.investmentId))
    .limit(1);
  if (!inv) throw new Error("Investment not found");

  if (!isAdmin && inv.userId !== actorUserId) {
    throw new Error("Forbidden");
  }

  const provider = createMockSignatureProvider(db);
  const [req] = await db
    .select()
    .from(signatureRequest)
    .where(
      and(
        eq(signatureRequest.documentId, documentId),
        eq(signatureRequest.signerRole, "investor")
      )
    )
    .limit(1);

  if (!req) {
    throw new Error("No signature request found for this document");
  }

  await provider.markSigned(req.id, { signedBy: actorUserId });

  const now = new Date();
  // Investor signing always leaves the doc at `signed`. It becomes `executed`
  // only when the GP countersigns (docs that don't require a GP signature count
  // as complete at `signed`).
  await db
    .update(subscriptionDocument)
    .set({
      status: "signed",
      signedAt: now,
      viewedAt: doc.viewedAt ?? now,
      lastViewedAt: doc.lastViewedAt ?? now,
      signedPdfPath: doc.pdfPath,
    })
    .where(eq(subscriptionDocument.id, documentId));

  await appendClosingEvent(db, {
    investmentId: inv.id,
    eventType: "document_signed",
    actorUserId,
    payload: { documentId },
  });

  await checkCompletionAndAdvanceToAwaitingFunds(db, inv.id, actorUserId);
  return { success: true };
}

export async function countersignDocument(
  db: Db,
  documentId: string,
  adminUserId: string
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");
  if (doc.status !== "signed") {
    throw new Error("Document must be signed by the investor before countersign");
  }
  if (!doc.requiresCountersign) {
    throw new Error("This document does not require a GP countersignature");
  }

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, doc.packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found");

  const provider = createMockSignatureProvider(db);
  const request = await provider.createRequest({
    documentId,
    signerUserId: adminUserId,
    signerRole: "admin_countersign",
  });
  await provider.markSigned(request.id, { countersigned: true });

  const now = new Date();
  await db
    .update(subscriptionDocument)
    .set({
      status: "executed",
      countersignedAt: now,
      executedAt: now,
    })
    .where(eq(subscriptionDocument.id, documentId));

  await appendClosingEvent(db, {
    investmentId: pkg.investmentId,
    eventType: "document_countersigned",
    actorUserId: adminUserId,
    payload: { documentId },
  });

  await checkCompletionAndAdvanceToAwaitingFunds(
    db,
    pkg.investmentId,
    adminUserId
  );

  return { success: true };
}

/**
 * When every signature-required document is complete, the investment
 * auto-advances awaiting_signature → awaiting_funds (system). This fires the
 * "documents executed / wire instructions available" email exactly once.
 *
 * A document is complete when:
 *   - it needs a GP countersign → it must be `executed`
 *   - it does NOT need a GP countersign → the investor's `signed` is final
 */
async function checkCompletionAndAdvanceToAwaitingFunds(
  db: Db,
  investmentId: string,
  actorUserId: string
) {
  const { inv, documents } = await loadPackageContext(db, investmentId);
  const required = documents.filter((d) => d.signatureRequired);
  if (required.length === 0) return;

  const allComplete = required.every((d) =>
    d.requiresCountersign
      ? d.status === "executed"
      : d.status === "signed"
  );
  if (!allComplete) return;

  if (inv.status === "awaiting_signature") {
    await transitionInvestmentStatus(db, {
      investmentId: inv.id,
      toStatus: "awaiting_funds",
      actor: "system",
      actorUserId,
      reason: "All required documents executed",
    });
    await appendClosingEvent(db, {
      investmentId: inv.id,
      eventType: "package_fully_signed",
      actorUserId,
    });
  }
}

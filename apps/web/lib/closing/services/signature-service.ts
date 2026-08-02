import { and, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  investment,
  signatureRequest,
  subscriptionDocument,
  subscriptionPackage,
} from "@repo/db/schema";
import { createSignatureProvider } from "../signatures";
import {
  fetchOpenSignDocumentState,
  rehostSignedPdfToNextcloud,
} from "../signatures/opensign-provider";
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
 * Attach per-document signing links (investor link + GP countersign link)
 * from the persisted signature requests. Used by the package queries.
 */
export async function attachSigningLinks(
  db: Db,
  documents: Array<{ id: string }>
): Promise<
  Record<
    string,
    { signingUrl?: string | null; gpSigningUrl?: string | null }
  >
> {
  if (documents.length === 0) return {};
  const rows = await db
    .select()
    .from(signatureRequest)
    .where(
      inArray(
        signatureRequest.documentId,
        documents.map((d) => d.id)
      )
    );

  const map: Record<
    string,
    { signingUrl?: string | null; gpSigningUrl?: string | null }
  > = {};
  for (const row of rows) {
    const meta = (row.metadata as Record<string, unknown> | null) ?? {};
    const link =
      typeof meta.signingUrl === "string" && meta.signingUrl
        ? meta.signingUrl
        : null;
    const entry = map[row.documentId] ?? {};
    if (row.signerRole === "admin_countersign") {
      entry.gpSigningUrl = link;
    } else {
      entry.signingUrl = link;
    }
    map[row.documentId] = entry;
  }
  return map;
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

  const provider = createSignatureProvider(db);
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
      metadata: {
        investmentId: inv.id,
        // GP countersigns on the same OpenSign document when required.
        ...(doc.requiresCountersign ? { countersignerUserId: actorUserId } : {}),
      },
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

  const provider = createSignatureProvider(db);
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

  const provider = createSignatureProvider(db);
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

  const provider = createSignatureProvider(db);
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
  actorUserId: string | null
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

// ---------------------------------------------------------------------------
// OpenSign webhook handling (idempotent)
// ---------------------------------------------------------------------------

export type OpenSignWebhookEvent = {
  event: "document.viewed" | "document.signed" | "document.completed" | "document.declined";
  documentId: string; // OpenSign document id == signature_request.externalId
  signerEmail?: string;
  signerName?: string;
  signedUrl?: string;
  viewedAt?: string | number;
  signedAt?: string | number;
  completedAt?: string | number;
  ipAddress?: string;
  declineReason?: string;
};

function parseOpenSignTime(value?: string | number): Date {
  if (!value) return new Date();
  if (typeof value === "number") return new Date(value);
  const num = Number(value);
  if (!Number.isNaN(num)) return new Date(num);
  return new Date(value);
}

function requestSignerEmail(row: typeof signatureRequest.$inferSelect): string {
  return (
    (row.metadata as Record<string, unknown> | null)?.signerEmail as
      | string
      | undefined
  ) ?? "";
}

async function markDocumentExecuted(
  db: Db,
  docId: string,
  event: OpenSignWebhookEvent
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, docId))
    .limit(1);
  if (!doc) return;

  const now = parseOpenSignTime(event.completedAt ?? event.signedAt);
  const signedPdfPath = doc.signedPdfPath;
  if (!signedPdfPath && event.signedUrl) {
    const path = await rehostSignedPdfToNextcloud(db, {
      documentId: docId,
      signedUrl: event.signedUrl,
    }).catch((error) => {
      console.error("[opensign] rehost failed:", error);
      return null;
    });
    await db
      .update(subscriptionDocument)
      .set({
        status: "executed",
        signedAt: doc.signedAt ?? now,
        executedAt: doc.executedAt ?? now,
        countersignedAt: doc.countersignedAt ?? now,
        signedPdfPath: path ?? doc.signedPdfPath,
      })
      .where(eq(subscriptionDocument.id, docId));
  } else {
    await db
      .update(subscriptionDocument)
      .set({
        status: "executed",
        signedAt: doc.signedAt ?? now,
        executedAt: doc.executedAt ?? now,
        countersignedAt: doc.countersignedAt ?? now,
      })
      .where(eq(subscriptionDocument.id, docId));
  }
}

/**
 * Single idempotent entry point for OpenSign events (webhooks + reconcile).
 * Never throws for unknown documents — it simply no-ops.
 */
export async function applyOpenSignEvent(
  db: Db,
  event: OpenSignWebhookEvent
): Promise<void> {
  const requests = await db
    .select()
    .from(signatureRequest)
    .where(eq(signatureRequest.externalId, event.documentId));

  if (requests.length === 0) return;

  const docId = requests[0].documentId;
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, docId))
    .limit(1);
  if (!doc) return;

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, doc.packageId))
    .limit(1);
  if (!pkg) return;

  // Restrict to the matching signer where the event names one.
  let matched = requests;
  if (event.signerEmail) {
    const byEmail = requests.filter(
      (r) =>
        requestSignerEmail(r).toLowerCase() ===
        event.signerEmail!.toLowerCase(),
    );
    if (byEmail.length > 0) matched = byEmail;
  }

  const now = new Date();

  switch (event.event) {
    case "document.viewed": {
      const viewedAt = parseOpenSignTime(event.viewedAt);
      await db
        .update(subscriptionDocument)
        .set({
          viewedAt: doc.viewedAt ?? viewedAt,
          lastViewedAt: now,
          openedCount: (doc.openedCount ?? 0) + 1,
        })
        .where(eq(subscriptionDocument.id, docId));
      await appendClosingEvent(db, {
        investmentId: pkg.investmentId,
        eventType: "document_viewed",
        actorUserId: null,
        payload: {
          documentId: docId,
          ...(event.ipAddress ? { ipAddress: event.ipAddress } : {}),
        },
      });
      return;
    }

    case "document.signed": {
      const signedAt = parseOpenSignTime(event.signedAt);
      for (const req of matched) {
        if (req.status !== "signed") {
          await db
            .update(signatureRequest)
            .set({ status: "signed", signedAt })
            .where(eq(signatureRequest.id, req.id));
        }
      }
      await appendClosingEvent(db, {
        investmentId: pkg.investmentId,
        eventType: "document_signed",
        actorUserId: null,
        payload: {
          documentId: docId,
          signerEmail: event.signerEmail ?? null,
        },
      });

      // All required signers signed → executed, else signed.
      const allSigned = requests.every(
        (r) =>
          r.status === "signed" ||
          matched.some((m) => m.id === r.id),
      );
      if (allSigned && doc.requiresCountersign) {
        await markDocumentExecuted(db, docId, event);
      } else if (!doc.requiresCountersign) {
        await db
          .update(subscriptionDocument)
          .set({
            status: "signed",
            signedAt: doc.signedAt ?? signedAt,
            lastViewedAt: now,
          })
          .where(eq(subscriptionDocument.id, docId));
      }
      break;
    }

    case "document.completed": {
      for (const req of requests) {
        if (req.status !== "signed") {
          await db
            .update(signatureRequest)
            .set({ status: "signed", signedAt: req.signedAt ?? now })
            .where(eq(signatureRequest.id, req.id));
        }
      }
      await markDocumentExecuted(db, docId, event);
      break;
    }

    case "document.declined": {
      for (const req of matched) {
        await db
          .update(signatureRequest)
          .set({ status: "declined" })
          .where(eq(signatureRequest.id, req.id));
      }
      await appendClosingEvent(db, {
        investmentId: pkg.investmentId,
        eventType: "document_declined",
        actorUserId: null,
        payload: {
          documentId: docId,
          signerEmail: event.signerEmail ?? null,
          reason: event.declineReason ?? null,
        },
      });
      return;
    }
  }

  await checkCompletionAndAdvanceToAwaitingFunds(db, pkg.investmentId, null);
}

/**
 * Best-effort fallback for missed webhooks: reconcile each non-terminal
 * OpenSign request from `getdocument`/`getsigners`. Never throws — a failure
 * here must not break the read path.
 */
export async function syncSignatureStatuses(
  db: Db,
  investmentId: string
): Promise<void> {
  if (!process.env.OPEN_SIGN_BASE_URL) return;

  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.investmentId, investmentId))
    .limit(1);
  if (!pkg) return;

  const docs = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.packageId, pkg.id));

  const requests = await db
    .select()
    .from(signatureRequest)
    .where(eq(signatureRequest.provider, "opensign"));

  for (const doc of docs) {
    if (doc.status === "executed") continue;
    const docRequests = requests.filter((r) => r.documentId === doc.id);
    if (docRequests.length === 0) continue;
    const anyPending = docRequests.some((r) =>
      ["pending", "sent"].includes(r.status),
    );
    if (!anyPending) continue;

    const externalId = docRequests[0].externalId;
    if (!externalId) continue;

    try {
      const state = await fetchOpenSignDocumentState(externalId);
      for (const signer of state.signers) {
        if (signer.status === "signed") {
          await applyOpenSignEvent(db, {
            event: "document.signed",
            documentId: externalId,
            signerEmail: signer.email,
            signedUrl: state.signedUrl ?? undefined,
            signedAt: signer.signedAt ?? undefined,
          });
        }
      }
      if (state.signedUrl) {
        await applyOpenSignEvent(db, {
          event: "document.completed",
          documentId: externalId,
          signedUrl: state.signedUrl,
          completedAt: state.completedAt ?? undefined,
        });
      }
    } catch (error) {
      console.error(
        `[opensign] reconcile failed for ${externalId}:`,
        error,
      );
    }
  }
}

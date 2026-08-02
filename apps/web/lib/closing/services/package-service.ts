import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  deal,
  documentGenerationJob,
  documentTemplate,
  investment,
  subscriptionDocument,
  subscriptionPackage,
  user,
} from "@repo/db/schema";
import {
  createNextcloudClientFromEnv,
  ensureDirectory,
  uploadBuffer,
  sanitizeDealFolderSegment,
} from "@repo/nextcloud";
import { renderTemplate } from "../templates/engine";
import { renderPdfFromHtml } from "../templates/pdf";
import { resolveTemplateVariables } from "../variables";
import {
  appendClosingEvent,
  transitionInvestmentStatus,
} from "./investment-closing-service";
import {
  SUBSCRIPTION_DOCUMENT_TYPE_LABELS,
} from "@repo/db/investment-closing";

type Db = DrizzleD1Database<Record<string, unknown>>;

function subscriptionFolderPath(dealSlug: string | null, dealId: string, investmentId: string) {
  const segment = sanitizeDealFolderSegment(dealSlug || dealId);
  return `/Deals/Deal_${segment}/subscriptions/${investmentId}`;
}

async function loadGenerationContext(db: Db, investmentId: string) {
  const [inv] = await db
    .select()
    .from(investment)
    .where(eq(investment.id, investmentId))
    .limit(1);
  if (!inv) throw new Error("Investment not found");

  const [[dealRow], [userRow], [pkg]] = await Promise.all([
    db.select().from(deal).where(eq(deal.id, inv.dealId)).limit(1),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.id, inv.userId))
      .limit(1),
    db
      .select()
      .from(subscriptionPackage)
      .where(eq(subscriptionPackage.investmentId, investmentId))
      .limit(1),
  ]);

  if (!dealRow) throw new Error("Deal not found");
  if (!pkg) throw new Error("Subscription package not found");

  const documents = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.packageId, pkg.id));

  const templates = await db.select().from(documentTemplate);
  const templateById = new Map(templates.map((t) => [t.id, t]));

  return { inv, dealRow, userRow, pkg, documents, templateById };
}

export async function generatePackage(
  db: Db,
  investmentId: string,
  actorUserId: string,
  options?: { regenerate?: boolean }
) {
  const ctx = await loadGenerationContext(db, investmentId);
  const { inv, dealRow, userRow, pkg, documents, templateById } = ctx;

  if (
    inv.status !== "pending_documents" &&
    inv.status !== "documents_generated" &&
    inv.status !== "awaiting_signature"
  ) {
    if (!options?.regenerate) {
      throw new Error(
        `Cannot generate documents from status "${inv.status}"`
      );
    }
  }

  const jobId = randomUUID();
  await db.insert(documentGenerationJob).values({
    id: jobId,
    packageId: pkg.id,
    status: "processing",
    attempts: 1,
  });

  await db
    .update(subscriptionPackage)
    .set({ status: "generating" })
    .where(eq(subscriptionPackage.id, pkg.id));

  try {
    const client = createNextcloudClientFromEnv();
    const folder = subscriptionFolderPath(dealRow.slug, dealRow.id, inv.id);
    await ensureDirectory(client, folder);

    const variables = resolveTemplateVariables({
      investorName: userRow?.name ?? "Investor",
      entityName: inv.entityName ?? userRow?.name ?? "Investor",
      committedAmount: inv.committedAmount,
      dealName: dealRow.name,
      fundName: dealRow.name,
      closingDate: dealRow.closeDate,
      generatedAt: new Date(),
    });

    const now = new Date();
    const nextVersion = options?.regenerate
      ? Math.max(...documents.map((d) => d.version), 0) + 1
      : undefined;

    for (const doc of documents) {
      const template =
        (doc.templateId ? templateById.get(doc.templateId) : undefined) ??
        [...templateById.values()].find(
          (t) => t.documentType === doc.documentType && t.isActive
        );

      if (!template) {
        throw new Error(`Missing template for ${doc.documentType}`);
      }

      const html = renderTemplate(template.body, variables);
      const title =
        SUBSCRIPTION_DOCUMENT_TYPE_LABELS[doc.documentType] ?? template.name;
      const pdfBytes = await renderPdfFromHtml(html, title);

      const version = nextVersion ?? doc.version;
      const base = `${doc.documentType}_v${version}`;
      const htmlPath = `${folder}/${base}.html`;
      const pdfPath = `${folder}/${base}.pdf`;

      await uploadBuffer(client, htmlPath, Buffer.from(html, "utf8"));
      await uploadBuffer(client, pdfPath, Buffer.from(pdfBytes));

      await db
        .update(subscriptionDocument)
        .set({
          templateId: template.id,
          version,
          status: "generated",
          signatureRequired: template.signatureRequired,
          requiresCountersign: template.countersignRequired,
          htmlPath,
          pdfPath,
          signedPdfPath: null,
          generatedAt: now,
          generatedBy: actorUserId,
          sentAt: null,
          viewedAt: null,
          lastViewedAt: null,
          downloadedAt: null,
          openedCount: 0,
          signedAt: null,
          countersignedAt: null,
          executedAt: template.signatureRequired ? null : now,
        })
        .where(eq(subscriptionDocument.id, doc.id));

      await appendClosingEvent(db, {
        investmentId: inv.id,
        eventType: "document_generated",
        actorUserId,
        payload: {
          documentId: doc.id,
          documentType: doc.documentType,
          pdfPath,
          version,
        },
      });
    }

    await db
      .update(subscriptionPackage)
      .set({
        status: "ready",
        generatedAt: now,
        regenerationCount: options?.regenerate
          ? pkg.regenerationCount + 1
          : pkg.regenerationCount,
      })
      .where(eq(subscriptionPackage.id, pkg.id));

    await db
      .update(documentGenerationJob)
      .set({ status: "completed" })
      .where(eq(documentGenerationJob.id, jobId));

    // If regenerating from later statuses, reset to pending_documents first then advance.
    if (inv.status !== "pending_documents") {
      if (
        inv.status === "documents_generated" ||
        inv.status === "awaiting_signature"
      ) {
        await transitionInvestmentStatus(db, {
          investmentId: inv.id,
          toStatus: "pending_documents",
          actor: "admin",
          actorUserId,
          reason: "Documents regenerated",
          emitNotification: false,
        });
      }
    }

    const updated = await transitionInvestmentStatus(db, {
      investmentId: inv.id,
      toStatus: "documents_generated",
      actor: "system",
      actorUserId,
      reason: options?.regenerate
        ? "Package regenerated"
        : "Package generated",
    });

    await appendClosingEvent(db, {
      investmentId: inv.id,
      eventType: options?.regenerate
        ? "package_regenerated"
        : "package_generated",
      actorUserId,
      payload: { packageId: pkg.id, jobId },
    });

    return { investment: updated, packageId: pkg.id, jobId };
  } catch (error) {
    await db
      .update(documentGenerationJob)
      .set({
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      })
      .where(eq(documentGenerationJob.id, jobId));
    await db
      .update(subscriptionPackage)
      .set({ status: "pending" })
      .where(eq(subscriptionPackage.id, pkg.id));
    throw error;
  }
}

export async function uploadReplacementPdf(
  db: Db,
  input: {
    documentId: string;
    actorUserId: string;
    fileName: string;
    bytes: Uint8Array;
  }
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, input.documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");

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

  const [dealRow] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, inv.dealId))
    .limit(1);
  if (!dealRow) throw new Error("Deal not found");

  const client = createNextcloudClientFromEnv();
  const folder = subscriptionFolderPath(dealRow.slug, dealRow.id, inv.id);
  await ensureDirectory(client, folder);

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pdfPath = `${folder}/${doc.documentType}_replacement_${Date.now()}_${safeName}`;
  await uploadBuffer(client, pdfPath, Buffer.from(input.bytes));

  const [updated] = await db
    .update(subscriptionDocument)
    .set({
      pdfPath,
      status: doc.status === "not_generated" ? "generated" : doc.status,
      generatedAt: new Date(),
      generatedBy: input.actorUserId,
      version: doc.version + 1,
    })
    .where(eq(subscriptionDocument.id, doc.id))
    .returning();

  await appendClosingEvent(db, {
    investmentId: inv.id,
    eventType: "document_replacement_uploaded",
    actorUserId: input.actorUserId,
    payload: { documentId: doc.id, pdfPath },
  });

  return updated;
}

export async function getDocumentDownloadPath(
  db: Db,
  documentId: string,
  kind: "pdf" | "signed" | "html" = "pdf"
) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) return null;
  if (kind === "signed") return doc.signedPdfPath;
  if (kind === "html") return doc.htmlPath;
  return doc.pdfPath;
}

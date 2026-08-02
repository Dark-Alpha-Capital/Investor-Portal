import { createFileRoute } from "@tanstack/react-router";
import { db } from "@repo/db";
import {
  investment,
  subscriptionDocument,
  subscriptionPackage,
} from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { authSession } from "@/lib/auth/session-from-request";
import {
  createNextcloudClientFromEnv,
  fileExists,
  getFileContents,
} from "@repo/nextcloud";
import { SUBSCRIPTION_DOCUMENT_TYPE_LABELS } from "@repo/db/investment-closing";
import {
  markDocumentViewed,
  recordDocumentDownloaded,
} from "@/lib/closing/services/signature-service";

/** Investor may download once the package has been released; admin always can. */
const INVESTOR_DOWNLOADABLE_STATUSES = [
  "awaiting_signature",
  "awaiting_funds",
  "funded",
  "closed",
];

/**
 * Proxy subscription PDFs through the portal.
 * Nextcloud WebDAV download links require Nextcloud session cookies the browser
 * does not have — streaming via service credentials avoids "Strict Cookie" errors.
 */
export const Route = createFileRoute("/api/subscription-documents/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await authSession();
          if (!session?.user) {
            return Response.json(
              { success: false, error: "Unauthorized" },
              { status: 401 },
            );
          }

          const params = new URL(request.url).searchParams;
          const documentId = params.get("documentId");
          const investmentId = params.get("investmentId");
          const kind = (params.get("kind") ?? "pdf") as
            | "pdf"
            | "signed"
            | "html";
          // preview=1 renders inline in the browser instead of forcing a download.
          const preview = params.get("preview") === "1";

          if (!documentId || !investmentId) {
            return Response.json(
              {
                success: false,
                error: "Bad Request",
                message: "documentId and investmentId are required",
              },
              { status: 400 },
            );
          }

          const [inv] = await db
            .select()
            .from(investment)
            .where(eq(investment.id, investmentId))
            .limit(1);

          if (!inv) {
            return Response.json(
              { success: false, error: "Not Found" },
              { status: 404 },
            );
          }

          const isAdmin = session.user.role === "admin";
          if (!isAdmin && inv.userId !== session.user.id) {
            return Response.json(
              { success: false, error: "Forbidden" },
              { status: 403 },
            );
          }

          // Documents are not visible until the admin sends the subscription package.
          if (!isAdmin && !INVESTOR_DOWNLOADABLE_STATUSES.includes(inv.status)) {
            return Response.json(
              {
                success: false,
                error: "Forbidden",
                message: "Subscription documents are not released yet",
              },
              { status: 403 },
            );
          }

          const [doc] = await db
            .select()
            .from(subscriptionDocument)
            .where(eq(subscriptionDocument.id, documentId))
            .limit(1);

          if (!doc) {
            return Response.json(
              { success: false, error: "Not Found" },
              { status: 404 },
            );
          }

          const [pkg] = await db
            .select()
            .from(subscriptionPackage)
            .where(eq(subscriptionPackage.id, doc.packageId))
            .limit(1);

          if (!pkg || pkg.investmentId !== investmentId) {
            return Response.json(
              { success: false, error: "Forbidden" },
              { status: 403 },
            );
          }

          const filePath =
            kind === "signed"
              ? doc.signedPdfPath
              : kind === "html"
                ? doc.htmlPath
                : doc.pdfPath;

          if (!filePath) {
            return Response.json(
              {
                success: false,
                error: "Not Found",
                message: "Document file not generated yet",
              },
              { status: 404 },
            );
          }

          const client = createNextcloudClientFromEnv();
          const exists = await fileExists(client, filePath);
          if (!exists) {
            return Response.json(
              {
                success: false,
                error: "Not Found",
                message: "File not found in storage",
              },
              { status: 404 },
            );
          }

          const bytes = await getFileContents(client, filePath);
          const label =
            SUBSCRIPTION_DOCUMENT_TYPE_LABELS[doc.documentType] ??
            doc.documentType;
          const ext = kind === "html" ? "html" : "pdf";
          const contentType =
            kind === "html" ? "text/html; charset=utf-8" : "application/pdf";
          const fileName = `${label.replace(/\s+/g, "_")}_v${doc.version}.${ext}`;

          // Preview = view telemetry + inline render; download = download telemetry + attachment.
          if (preview) {
            await markDocumentViewed(db, documentId, session.user.id).catch(
              (error) => {
                console.error(
                  "[subscription-documents/download] failed to record preview telemetry:",
                  error,
                );
              },
            );
          } else {
            await recordDocumentDownloaded(db, documentId, session.user.id, {
              userAgent: request.headers.get("user-agent") ?? undefined,
            }).catch((error) => {
              console.error(
                "[subscription-documents/download] failed to record download telemetry:",
                error,
              );
            });
          }

          return new Response(bytes as unknown as BodyInit, {
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${encodeURIComponent(fileName)}"`,
              "Content-Length": bytes.byteLength.toString(),
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        } catch (error) {
          console.error("[subscription-documents/download]", error);
          return Response.json(
            {
              success: false,
              error: "Internal Server Error",
              message: "Failed to download subscription document",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

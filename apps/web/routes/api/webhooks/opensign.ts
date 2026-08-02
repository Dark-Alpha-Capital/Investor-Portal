import { createFileRoute } from "@tanstack/react-router";
import { db } from "@repo/db";
import {
  applyOpenSignEvent,
  type OpenSignWebhookEvent,
} from "@/lib/closing/services/signature-service";
import { verifyOpenSignWebhookSignature } from "@/lib/closing/signatures/opensign-provider";

/**
 * OpenSign webhook receiver.
 * OpenSign POSTs `document.viewed|signed|completed|declined` events with an
 * `X-OpenSign-Signature: hmac-sha256(body)` header signed with WEBHOOK_SECRET.
 * Handlers are idempotent, so duplicates/retries are safe.
 */
export const Route = createFileRoute("/api/webhooks/opensign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.arrayBuffer();

        const signature = request.headers.get("X-OpenSign-Signature");
        const valid = await verifyOpenSignWebhookSignature(raw, signature);
        if (!valid) {
          return Response.json(
            { success: false, error: "Invalid signature" },
            { status: 401 },
          );
        }

        let payload: unknown;
        try {
          payload = JSON.parse(new TextDecoder().decode(raw));
        } catch {
          return Response.json(
            { success: false, error: "Invalid JSON body" },
            { status: 400 },
          );
        }

        const body = payload as Partial<OpenSignWebhookEvent> & {
          event?: string;
        };

        const eventType = body.event;
        const documentId = body.documentId;
        if (
          !documentId ||
          !eventType ||
          !["document.viewed", "document.signed", "document.completed", "document.declined"].includes(
            eventType,
          )
        ) {
          return Response.json(
            { success: false, error: "Unsupported event" },
            { status: 400 },
          );
        }

        await applyOpenSignEvent(db, {
          event: eventType as OpenSignWebhookEvent["event"],
          documentId,
          signerEmail: body.signerEmail,
          signerName: body.signerName,
          signedUrl: body.signedUrl,
          viewedAt: body.viewedAt,
          signedAt: body.signedAt,
          completedAt: body.completedAt,
          ipAddress: body.ipAddress,
          declineReason: body.declineReason,
        });

        return Response.json({ success: true });
      },
    },
  },
});

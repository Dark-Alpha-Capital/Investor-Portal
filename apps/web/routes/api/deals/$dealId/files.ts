import { createFileRoute } from "@tanstack/react-router";
import { requireAdminApiSession } from "@/lib/auth/require-admin-api";
import { createDealFileStore } from "@/lib/deals/deal-file-store";

export const Route = createFileRoute("/api/deals/$dealId/files")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const guarded = await requireAdminApiSession();
          if (!guarded.ok) {
            return guarded.response;
          }

          const { dealId } = params;

          const relativeHeader = request.headers.get("X-File-Path");
          if (!relativeHeader) {
            return Response.json(
              { success: false, message: "Missing file path" },
              { status: 400 },
            );
          }
          let decodedRelative = relativeHeader;
          try {
            decodedRelative = decodeURIComponent(relativeHeader);
          } catch {
            return Response.json(
              { success: false, message: "Invalid file path" },
              { status: 400 },
            );
          }

          const rawLength = request.headers.get("Content-Length");
          if (rawLength === null) {
            return Response.json(
              { success: false, message: "Missing content length" },
              { status: 400 },
            );
          }
          const contentLength = Number(rawLength);
          if (!Number.isFinite(contentLength) || contentLength < 0) {
            return Response.json(
              { success: false, message: "Invalid content length" },
              { status: 400 },
            );
          }

          const body = request.body;
          if (!body) {
            return Response.json(
              { success: false, message: "Missing request body" },
              { status: 400 },
            );
          }

          // Buffer the body so the PUT to Nextcloud can be retried on transient
          // 409/423 conflicts (concurrent uploads racing to create folders).
          const bodyBytes = new Uint8Array(await request.arrayBuffer());
          if (bodyBytes.byteLength !== contentLength) {
            return Response.json(
              { success: false, message: "Request body size mismatch" },
              { status: 400 },
            );
          }

          const rawFileType = request.headers.get("X-File-Type");
          const contentType =
            rawFileType && /^[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+$/.test(rawFileType)
              ? rawFileType
              : "application/octet-stream";

          const result = await createDealFileStore().upload(dealId, {
            relativePath: decodedRelative,
            body: bodyBytes,
            length: contentLength,
            contentType,
          });

          return Response.json({ success: true, ...result });
        } catch (error) {
          console.error("Error uploading deal file:", error);
          const status = (error as { status?: number } | undefined)?.status;
          if (typeof status === "number" && status >= 400 && status < 500) {
            return Response.json(
              {
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : `Upload failed (${status})`,
              },
              { status },
            );
          }
          return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});

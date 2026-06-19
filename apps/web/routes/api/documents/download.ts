import { createFileRoute } from "@tanstack/react-router";
import { db } from "@repo/db";
import { onboardingDocument, onboarding } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { authSession } from "@/lib/auth-session-from-request";
import {
  createNextcloudClientFromEnv,
  fileExists,
  getFileContents,
} from "@repo/nextcloud";

export const Route = createFileRoute("/api/documents/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await authSession();

          if (!session?.user) {
            return Response.json(
              {
                success: false,
                error: "Unauthorized",
                message: "You must be logged in to download documents",
              },
              { status: 401 },
            );
          }

          if (session.user.role !== "admin") {
            return Response.json(
              {
                success: false,
                error: "Forbidden",
                message: "Only administrators can download KYC documents",
              },
              { status: 403 },
            );
          }

          const searchParams = new URL(request.url).searchParams;
          const documentId =
            searchParams.get("id") || searchParams.get("documentId");

          if (!documentId) {
            return Response.json(
              {
                success: false,
                error: "Bad Request",
                message: "Document ID is required",
              },
              { status: 400 },
            );
          }

          const [document] = await db
            .select({
              id: onboardingDocument.id,
              filePath: onboardingDocument.filePath,
              fileUrl: onboardingDocument.fileUrl,
              fileName: onboardingDocument.fileName,
              fileType: onboardingDocument.fileType,
              onboardingId: onboardingDocument.onboardingId,
            })
            .from(onboardingDocument)
            .where(eq(onboardingDocument.id, documentId))
            .limit(1);

          if (!document) {
            return Response.json(
              {
                success: false,
                error: "Not Found",
                message: "Document not found",
              },
              { status: 404 },
            );
          }

          const [onboardingRecord] = await db
            .select({
              id: onboarding.id,
              userId: onboarding.userId,
            })
            .from(onboarding)
            .where(eq(onboarding.id, document.onboardingId))
            .limit(1);

          if (!onboardingRecord) {
            return Response.json(
              {
                success: false,
                error: "Not Found",
                message: "Onboarding record not found",
              },
              { status: 404 },
            );
          }

          if (document.filePath) {
            if (
              !process.env.NEXTCLOUD_URL ||
              !process.env.NEXTCLOUD_USER ||
              !process.env.NEXTCLOUD_PASSWORD
            ) {
              return Response.json(
                {
                  success: false,
                  error: "Configuration Error",
                  message: "Nextcloud configuration is missing",
                },
                { status: 500 },
              );
            }

            const client = createNextcloudClientFromEnv();

            const exists = await fileExists(client, document.filePath);
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

            const uint8Array = await getFileContents(
              client,
              document.filePath,
            );

            return new Response(uint8Array as unknown as BodyInit, {
              headers: {
                "Content-Type":
                  document.fileType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName || "document")}"`,
                "Content-Length": uint8Array.byteLength.toString(),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
            });
          }

          return Response.json(
            {
              success: false,
              error: "Not Found",
              message: "No Nextcloud file path available for this document",
            },
            { status: 404 },
          );
        } catch (error) {
          console.error("Error downloading document:", error);
          return Response.json(
            {
              success: false,
              error: "Internal Server Error",
              message: "An error occurred while downloading the document",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

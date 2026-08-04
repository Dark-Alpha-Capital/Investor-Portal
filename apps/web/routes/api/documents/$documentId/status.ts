import { createFileRoute } from "@tanstack/react-router";
import { requireAdminApiSession } from "@/lib/auth/require-admin-api";
import { db } from "@repo/db";
import { onboardingDocument } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "incorrect_doc"
  | "needs_revision";

export const Route = createFileRoute("/api/documents/$documentId/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const guarded = await requireAdminApiSession();
          if (!guarded.ok) {
            return guarded.response;
          }
          const session = guarded.session;

          const { documentId } = params;
          const body = await request.json();
          const { status } = body;

          const validStatuses: DocumentStatus[] = [
            "pending",
            "approved",
            "rejected",
            "incorrect_doc",
            "needs_revision",
          ];

          if (!validStatuses.includes(status)) {
            return Response.json(
              { success: false, message: "Invalid status" },
              { status: 400 },
            );
          }

          const [updatedDocument] = await db
            .update(onboardingDocument)
            .set({
              status: status as DocumentStatus,
              reviewedAt: status !== "pending" ? new Date() : null,
              reviewedBy: status !== "pending" ? session.user.id : null,
              updatedAt: new Date(),
            })
            .where(eq(onboardingDocument.id, documentId))
            .returning();

          if (!updatedDocument) {
            return Response.json(
              { success: false, message: "Document not found" },
              { status: 404 },
            );
          }

          return Response.json({
            success: true,
            document: updatedDocument,
          });
        } catch (error) {
          console.error("Error updating document status:", error);
          return Response.json(
            {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : "Internal server error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

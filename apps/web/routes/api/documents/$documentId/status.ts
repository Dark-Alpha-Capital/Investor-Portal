import { createFileRoute } from "@tanstack/react-router";
import { authSession } from "@/lib/auth-session-from-request";
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
          const session = await authSession();

          if (!session) {
            return Response.json(
              { success: false, message: "Unauthorized" },
              { status: 401 },
            );
          }

          if (session.user.role !== "admin") {
            return Response.json(
              {
                success: false,
                message: "Forbidden - Admin access required",
              },
              { status: 403 },
            );
          }

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

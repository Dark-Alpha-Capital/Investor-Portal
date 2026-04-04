import { createFileRoute } from "@tanstack/react-router";
import { db } from "@repo/db";
import { onboardingDocument, onboarding } from "@repo/db/schema";
import { getSignedUrl } from "@/lib/storage";
import { eq } from "drizzle-orm";
import { authSession } from "@/lib/auth-session-from-request";

export const Route = createFileRoute("/api/documents/access")({
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
                message: "You must be logged in to access documents",
              },
              { status: 401 },
            );
          }

          if (session.user.role !== "admin") {
            return Response.json(
              {
                success: false,
                error: "Forbidden",
                message: "Only administrators can access KYC documents",
              },
              { status: 403 },
            );
          }

          const searchParams = new URL(request.url).searchParams;
          const documentId = searchParams.get("documentId");

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
              fileUrl: onboardingDocument.fileUrl,
              fileName: onboardingDocument.fileName,
              fileType: onboardingDocument.fileType,
              onboardingId: onboardingDocument.onboardingId,
            })
            .from(onboardingDocument)
            .where(eq(onboardingDocument.id, documentId))
            .limit(1);

          if (!document || !document.fileUrl) {
            return Response.json(
              {
                success: false,
                error: "Not Found",
                message: "Document not found or file URL is missing",
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

          const signedUrl = await getSignedUrl(document.fileUrl, 15);

          if (!signedUrl) {
            return Response.json(
              {
                success: false,
                error: "Internal Server Error",
                message: "Failed to generate signed URL",
              },
              { status: 500 },
            );
          }

          return Response.json({
            success: true,
            signedUrl,
            fileName: document.fileName,
            fileType: document.fileType,
            expiresIn: 15,
          });
        } catch (error) {
          console.error("Error generating document access URL:", error);
          return Response.json(
            {
              success: false,
              error: "Internal Server Error",
              message: "An error occurred while generating the access URL",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

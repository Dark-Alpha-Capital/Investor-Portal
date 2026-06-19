import { createFileRoute } from "@tanstack/react-router";
import { authSession } from "@/lib/auth-session-from-request";
import { db } from "@repo/db";
import { onboarding } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_more_info";

export const Route = createFileRoute("/api/onboarding/$onboardingId/status")({
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

          const { onboardingId } = params;
          const body = await request.json();
          const { status } = body;

          const validStatuses: OnboardingStatus[] = [
            "draft",
            "submitted",
            "under_review",
            "approved",
            "rejected",
            "needs_more_info",
          ];

          if (!validStatuses.includes(status)) {
            return Response.json(
              { success: false, message: "Invalid status" },
              { status: 400 },
            );
          }

          const [updatedOnboarding] = await db
            .update(onboarding)
            .set({
              status: status as OnboardingStatus,
              reviewedAt:
                status === "approved" || status === "rejected"
                  ? new Date()
                  : null,
              reviewedBy:
                status === "approved" || status === "rejected"
                  ? session.user.id
                  : null,
              updatedAt: new Date(),
            })
            .where(eq(onboarding.id, onboardingId))
            .returning();

          if (!updatedOnboarding) {
            return Response.json(
              { success: false, message: "Onboarding not found" },
              { status: 404 },
            );
          }

          return Response.json({
            success: true,
            onboarding: updatedOnboarding,
          });
        } catch (error) {
          console.error("Error updating onboarding status:", error);
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

import { NextRequest, NextResponse } from "next/server";
import { authSession } from "@/app/(auth)/auth";
import { db } from "@repo/db";
import { onboarding } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{
    onboardingId: string;
  }>;
};

type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_more_info";

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await authSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { onboardingId } = resolvedParams;
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
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update onboarding status
    const [updatedOnboarding] = await db
      .update(onboarding)
      .set({
        status: status as OnboardingStatus,
        reviewedAt:
          status === "approved" || status === "rejected" ? new Date() : null,
        reviewedBy:
          status === "approved" || status === "rejected"
            ? session.user.id
            : null,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.id, onboardingId))
      .returning();

    if (!updatedOnboarding) {
      return NextResponse.json(
        { success: false, message: "Onboarding not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding: updatedOnboarding,
    });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

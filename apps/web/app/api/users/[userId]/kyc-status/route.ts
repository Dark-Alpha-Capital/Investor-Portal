import { NextRequest, NextResponse } from "next/server";
import { updateKycStatus } from "@repo/db/queries";
import { getSession } from "@/lib/get-session";

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

/**
 * PATCH /api/users/[userId]/kyc-status
 * Updates a user's KYC status
 * Only accessible by admin users
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to update KYC status",
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can update KYC status",
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // Parse request body
    const body = await request.json();
    const { kycStatus } = body;

    // Validate KYC status
    const validStatuses = ["review", "approved", "pending_docs", "rejected"];
    if (!kycStatus || !validStatuses.includes(kycStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: `Invalid KYC status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update KYC status
    const updatedUser = await updateKycStatus(
      userId,
      kycStatus as "review" | "approved" | "pending_docs" | "rejected"
    );

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "User not found or update failed",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        kycStatus: updatedUser.kycStatus,
      },
      message: "KYC status updated successfully",
    });
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "An error occurred while updating KYC status",
      },
      { status: 500 }
    );
  }
}

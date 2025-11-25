import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, dealInterest, dealInvite, user } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * POST /api/deals/[dealId]/interest
 * Express interest in a deal (for investors)
 * Body: { status: "interested" | "soft_committed" | "pass" | "meeting_requested", proposedAmount?: number }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to express interest",
        },
        { status: 401 }
      );
    }

    // Verify deal exists and user has access (by ID or slug)
    const [dealRecord] = await db
      .select()
      .from(deal)
      .where(eq(deal.id, dealId))
      .limit(1);

    // Use the actual deal ID for subsequent queries
    const actualDealId = dealRecord?.id || dealId;

    if (!dealRecord || dealRecord.status === "draft") {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Deal not found",
        },
        { status: 404 }
      );
    }

    // Check access based on visibility
    if (dealRecord.visibility === "public") {
      // Public deals are accessible to everyone
    } else if (dealRecord.visibility === "accredited") {
      // Check if user is accredited
      const [userRecord] = await db
        .select({ kycStatus: user.kycStatus })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (userRecord?.kycStatus !== "approved") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden",
            message: "This deal is only available to accredited investors",
          },
          { status: 403 }
        );
      }
    } else if (dealRecord.visibility === "invite_only") {
      // Check if user has been invited
      const [invite] = await db
        .select()
        .from(dealInvite)
        .where(
          and(
            eq(dealInvite.dealId, actualDealId),
            eq(dealInvite.userId, session.user.id)
          )
        )
        .limit(1);

      if (!invite) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden",
            message: "You do not have access to this deal",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { status, proposedAmount } = body;

    // Validate status
    const validStatuses = [
      "interested",
      "soft_committed",
      "pass",
      "meeting_requested",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if interest already exists
    const [existingInterest] = await db
      .select()
      .from(dealInterest)
      .where(
        and(
          eq(dealInterest.dealId, actualDealId),
          eq(dealInterest.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingInterest) {
      // Update existing interest
      const [updatedInterest] = await db
        .update(dealInterest)
        .set({
          status,
          proposedAmount: proposedAmount ? proposedAmount.toString() : null,
          updatedAt: new Date(),
        })
        .where(eq(dealInterest.id, existingInterest.id))
        .returning();

      return NextResponse.json({
        success: true,
        interest: updatedInterest,
        message: "Interest updated successfully",
      });
    } else {
      // Create new interest
      const [newInterest] = await db
        .insert(dealInterest)
        .values({
          id: randomUUID(),
          dealId: actualDealId,
          userId: session.user.id,
          status,
          proposedAmount: proposedAmount ? proposedAmount.toString() : null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        interest: newInterest,
        message: "Interest expressed successfully",
      });
    }
  } catch (error) {
    console.error("Error expressing interest:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to express interest",
      },
      { status: 500 }
    );
  }
}

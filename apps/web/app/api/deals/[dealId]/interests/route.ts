import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, dealInterest, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * GET /api/deals/[dealId]/interests
 * Get all interests for a deal (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can access deal interests",
        },
        { status: 403 }
      );
    }

    // Verify deal exists
    const [dealRecord] = await db
      .select()
      .from(deal)
      .where(eq(deal.id, dealId))
      .limit(1);

    if (!dealRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Deal not found",
        },
        { status: 404 }
      );
    }

    // Get all interests for this deal with user info
    const interests = await db
      .select({
        id: dealInterest.id,
        dealId: dealInterest.dealId,
        userId: dealInterest.userId,
        status: dealInterest.status,
        proposedAmount: dealInterest.proposedAmount,
        createdAt: dealInterest.createdAt,
        updatedAt: dealInterest.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(dealInterest)
      .innerJoin(user, eq(dealInterest.userId, user.id))
      .where(eq(dealInterest.dealId, dealId));

    return NextResponse.json({
      success: true,
      interests,
    });
  } catch (error) {
    console.error("Error fetching deal interests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch deal interests",
      },
      { status: 500 }
    );
  }
}

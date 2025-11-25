import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, investment, user } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * GET /api/deals/[dealId]/investments
 * Get all investments for a deal (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can access deal investments",
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

    // Get all investments for this deal with user info
    const investments = await db
      .select({
        id: investment.id,
        dealId: investment.dealId,
        userId: investment.userId,
        committedAmount: investment.committedAmount,
        fundedAmount: investment.fundedAmount,
        currentValue: investment.currentValue,
        distributions: investment.distributions,
        status: investment.status,
        ownershipPercentage: investment.ownershipPercentage,
        committedDate: investment.committedDate,
        createdAt: investment.createdAt,
        updatedAt: investment.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(investment)
      .innerJoin(user, eq(investment.userId, user.id))
      .where(eq(investment.dealId, dealId));

    return NextResponse.json({
      success: true,
      investments,
    });
  } catch (error) {
    console.error("Error fetching deal investments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch deal investments",
      },
      { status: 500 }
    );
  }
}

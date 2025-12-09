import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db";
import { investment } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

type RouteParams = {
  params: Promise<{
    investmentId: string;
  }>;
};

/**
 * PATCH /api/investments/[investmentId]
 * Update an investment record
 *
 * WHO CALLS THIS:
 * - ADMIN ONLY: For updating fundedAmount, currentValue, distributions, status
 * - Users CANNOT update investments (investments are admin-managed records)
 *
 * USED FOR:
 * - Updating fundedAmount when money is wired (status: "committed" → "active")
 * - Updating currentValue (admin/periodic NAV updates)
 * - Updating distributions (cash returned to investors)
 * - Updating status (committed → active → liquidated, etc.)
 *
 * WORKFLOW:
 * 1. Admin creates investment (POST) after docs signed
 * 2. Admin updates fundedAmount (PATCH) after wire transfer confirmed
 * 3. Admin periodically updates currentValue (PATCH) for NAV
 * 4. Admin updates distributions (PATCH) when cash is returned
 *
 * Body: { fundedAmount?: number, currentValue?: number, distributions?: number, status?: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { investmentId } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to update investments",
        },
        { status: 401 }
      );
    }

    // Check if investment exists and belongs to user (unless admin)
    const [existingInvestment] = await db
      .select()
      .from(investment)
      .where(eq(investment.id, investmentId))
      .limit(1);

    if (!existingInvestment) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Investment not found",
        },
        { status: 404 }
      );
    }

    // Only admins can update investments (investments are admin-managed records)
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can update investment records",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fundedAmount,
      currentValue,
      distributions,
      status,
      ownershipPercentage,
    } = body;

    // Build update object
    const updateData: Partial<typeof investment.$inferInsert> = {};

    if (fundedAmount !== undefined) {
      updateData.fundedAmount = fundedAmount.toString();
      // If funding money, automatically update status to "active" if it was "committed"
      if (
        existingInvestment.status === "committed" &&
        parseFloat(fundedAmount.toString()) > 0
      ) {
        updateData.status = "active";
      }
    }

    if (currentValue !== undefined) {
      updateData.currentValue = currentValue.toString();
    }

    if (distributions !== undefined) {
      updateData.distributions = distributions.toString();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (ownershipPercentage !== undefined) {
      updateData.ownershipPercentage = ownershipPercentage.toString();
    }

    // Update investment
    const [updatedInvestment] = await db
      .update(investment)
      .set(updateData)
      .where(eq(investment.id, investmentId))
      .returning();

    return NextResponse.json({
      success: true,
      investment: updatedInvestment,
      message: "Investment updated successfully",
    });
  } catch (error) {
    console.error("Error updating investment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to update investment",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/investments/[investmentId]
 * Get a specific investment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { investmentId } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to view investments",
        },
        { status: 401 }
      );
    }

    const [investmentRecord] = await db
      .select()
      .from(investment)
      .where(eq(investment.id, investmentId))
      .limit(1);

    if (!investmentRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Investment not found",
        },
        { status: 404 }
      );
    }

    // Non-admins can only view their own investments
    if (
      session.user.role !== "admin" &&
      investmentRecord.userId !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You can only view your own investments",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      investment: investmentRecord,
    });
  } catch (error) {
    console.error("Error fetching investment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch investment",
      },
      { status: 500 }
    );
  }
}

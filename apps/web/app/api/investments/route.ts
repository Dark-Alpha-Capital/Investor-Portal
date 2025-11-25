import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { investment, deal, dealInterest } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * POST /api/investments
 * Create a new investment record (when user commits/signs docs)
 * Body: { dealId: string, committedAmount: number, committedDate?: string, userId?: string }
 *
 * WHO CALLS THIS:
 * - ADMIN ONLY: After user signs commitment documents offline
 * - Admin can specify userId to create investment for any user
 * - If userId not provided, uses current session user (for admin's own investments)
 *
 * WORKFLOW:
 * 1. User expresses interest (dealInterest) - User does this
 * 2. User signs commitment docs offline - Legal/Admin process
 * 3. Admin creates investment record here - Admin does this
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to create an investment",
        },
        { status: 401 }
      );
    }

    // Only admins can create investments (after documents are signed)
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can create investment records",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      dealId,
      committedAmount,
      committedDate,
      ownershipPercentage,
      userId, // Admin can specify userId, otherwise uses session user
    } = body;

    // Use provided userId or default to session user (for admin's own investments)
    const targetUserId = userId || session.user.id;

    // Validate required fields
    if (!dealId || !committedAmount) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "dealId and committedAmount are required",
        },
        { status: 400 }
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

    // Check if investment already exists for this user and deal
    const [existingInvestment] = await db
      .select()
      .from(investment)
      .where(
        and(eq(investment.dealId, dealId), eq(investment.userId, targetUserId))
      )
      .limit(1);

    if (existingInvestment) {
      return NextResponse.json(
        {
          success: false,
          error: "Conflict",
          message: "Investment already exists for this deal",
        },
        { status: 409 }
      );
    }

    // Create investment record with status "committed" (signed docs, money not wired yet)
    const [newInvestment] = await db
      .insert(investment)
      .values({
        id: randomUUID(),
        dealId,
        userId: targetUserId, // Use targetUserId (can be different user if admin)
        committedAmount: committedAmount.toString(),
        committedDate: committedDate ? new Date(committedDate) : new Date(),
        fundedAmount: "0", // No money wired yet
        status: "committed", // Signed docs, money not wired yet
        ownershipPercentage: ownershipPercentage
          ? ownershipPercentage.toString()
          : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      investment: newInvestment,
      message: "Investment committed successfully",
    });
  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to create investment",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/investments
 * Get all investments for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Get all investments for this user with deal information
    const investments = await db
      .select({
        id: investment.id,
        dealId: investment.dealId,
        dealName: deal.name,
        committedAmount: investment.committedAmount,
        fundedAmount: investment.fundedAmount,
        currentValue: investment.currentValue,
        distributions: investment.distributions,
        status: investment.status,
        committedDate: investment.committedDate,
        ownershipPercentage: investment.ownershipPercentage,
        createdAt: investment.createdAt,
        updatedAt: investment.updatedAt,
      })
      .from(investment)
      .innerJoin(deal, eq(investment.dealId, deal.id))
      .where(eq(investment.userId, session.user.id));

    return NextResponse.json({
      success: true,
      investments,
    });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch investments",
      },
      { status: 500 }
    );
  }
}

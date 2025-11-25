import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { investment, deal } from "@repo/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/investments/portfolio
 * Get portfolio metrics for the current user
 * Returns: Capital Committed, Capital Deployed, Current Value (NAV)
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
          message: "You must be logged in to view your portfolio",
        },
        { status: 401 }
      );
    }

    // Fetch all investments for this user with deal information
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
      })
      .from(investment)
      .innerJoin(deal, eq(investment.dealId, deal.id))
      .where(eq(investment.userId, session.user.id));

    // Calculate portfolio metrics
    const capitalCommitted = investments.reduce((sum, inv) => {
      const amount = inv.committedAmount ? parseFloat(inv.committedAmount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const capitalDeployed = investments.reduce((sum, inv) => {
      const amount = inv.fundedAmount ? parseFloat(inv.fundedAmount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const currentValue = investments.reduce((sum, inv) => {
      const amount = inv.currentValue ? parseFloat(inv.currentValue) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return NextResponse.json({
      success: true,
      portfolio: {
        capitalCommitted,
        capitalDeployed,
        currentValue,
        totalInvestments: investments.length,
      },
      investments,
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch portfolio data",
      },
      { status: 500 }
    );
  }
}


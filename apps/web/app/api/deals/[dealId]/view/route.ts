import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, dealInvite, dealInterest, user, investment } from "@repo/db/schema";
import { eq, and, or, ne } from "drizzle-orm";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * GET /api/deals/[dealId]/view
 * Get a specific deal for investors with access control
 * Supports both deal ID and slug lookup
 * - Public deals: visible to everyone
 * - Accredited deals: only visible if user's kycStatus === "approved"
 * - Invite-only deals: only visible if user has an entry in dealInvite
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
          message: "You must be logged in to view deals",
        },
        { status: 401 }
      );
    }

    // Fetch the deal by ID or slug
    const [dealRecord] = await db
      .select()
      .from(deal)
      .where(or(eq(deal.id, dealId), eq(deal.slug, dealId)))
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

    // Exclude draft deals
    if (dealRecord.status === "draft") {
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
            eq(dealInvite.dealId, dealId),
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

    const actualDealId = dealRecord.id;

    // Get user's interest in this deal (if any)
    const [userInterest] = await db
      .select()
      .from(dealInterest)
      .where(
        and(
          eq(dealInterest.dealId, actualDealId),
          eq(dealInterest.userId, session.user.id)
        )
      )
      .limit(1);

    // Get user's investment in this deal (if any)
    const [userInvestment] = await db
      .select()
      .from(investment)
      .where(
        and(
          eq(investment.dealId, actualDealId),
          eq(investment.userId, session.user.id)
        )
      )
      .limit(1);

    // Get curation note if invite-only
    let curationNote = null;
    if (dealRecord.visibility === "invite_only") {
      const [invite] = await db
        .select({ curationNote: dealInvite.curationNote })
        .from(dealInvite)
        .where(
          and(
            eq(dealInvite.dealId, actualDealId),
            eq(dealInvite.userId, session.user.id)
          )
        )
        .limit(1);
      curationNote = invite?.curationNote || null;
    }

    return NextResponse.json({
      success: true,
      deal: dealRecord,
      userInterest: userInterest || null,
      userInvestment: userInvestment || null,
      curationNote,
    });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch deal",
      },
      { status: 500 }
    );
  }
}


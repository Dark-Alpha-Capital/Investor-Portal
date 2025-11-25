import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, dealInvite } from "@repo/db/schema";
import { desc, eq, and, ne } from "drizzle-orm";

/**
 * GET /api/deals/curated
 * Get invite-only deals that the user has been invited to view
 * Only shows deals where the user has an entry in dealInvite table
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
          message: "You must be logged in to view curated deals",
        },
        { status: 401 }
      );
    }

    // Fetch invite-only deals that the user has been invited to
    // Join dealInvite to get only deals where user has an invite
    const deals = await db
      .select({
        id: deal.id,
        name: deal.name,
        slug: deal.slug,
        description: deal.description,
        teaserSummary: deal.teaserSummary,
        sector: deal.sector,
        geography: deal.geography,
        dealType: deal.dealType,
        targetRaise: deal.targetRaise,
        minInvestment: deal.minInvestment,
        targetIrr: deal.targetIrr,
        targetMoic: deal.targetMoic,
        status: deal.status,
        visibility: deal.visibility,
        coverImageUrl: deal.coverImageUrl,
        launchDate: deal.launchDate,
        closeDate: deal.closeDate,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        curationNote: dealInvite.curationNote,
        invitedAt: dealInvite.createdAt,
      })
      .from(dealInvite)
      .innerJoin(deal, eq(dealInvite.dealId, deal.id))
      .where(
        and(
          eq(dealInvite.userId, session.user.id),
          eq(deal.visibility, "invite_only"),
          ne(deal.status, "draft") // Exclude draft deals
        )
      )
      .orderBy(desc(deal.createdAt));

    return NextResponse.json({
      success: true,
      deals,
    });
  } catch (error) {
    console.error("Error fetching curated deals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch curated deals",
      },
      { status: 500 }
    );
  }
}


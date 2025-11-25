import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal, user } from "@repo/db/schema";
import { desc, eq, or, and, ne } from "drizzle-orm";

/**
 * GET /api/deals/marketplace
 * Get public and accredited deals for normal users
 * - Shows public deals to everyone
 * - Shows accredited deals only to users with kycStatus === "approved"
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
          message: "You must be logged in to view deals",
        },
        { status: 401 }
      );
    }

    // Get user's KYC status
    const [userRecord] = await db
      .select({ kycStatus: user.kycStatus })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isAccredited = userRecord?.kycStatus === "approved";

    // Build visibility filter
    // Public deals: visible to everyone
    // Accredited deals: only visible if user is accredited
    const visibilityConditions = [eq(deal.visibility, "public")];

    if (isAccredited) {
      visibilityConditions.push(eq(deal.visibility, "accredited"));
    }

    // Fetch deals that are:
    // 1. Not draft (exclude draft deals)
    // 2. Public or (accredited if user is approved)
    // 3. Not invite_only (those are handled separately)
    const deals = await db
      .select()
      .from(deal)
      .where(
        and(
          ne(deal.status, "draft"), // Exclude draft deals
          ne(deal.visibility, "invite_only"), // Exclude invite-only deals
          or(...visibilityConditions) // Public or accredited (if user is accredited)
        )
      )
      .orderBy(desc(deal.createdAt));

    return NextResponse.json({
      success: true,
      deals,
    });
  } catch (error) {
    console.error("Error fetching marketplace deals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch deals",
      },
      { status: 500 }
    );
  }
}


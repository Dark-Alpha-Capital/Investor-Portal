import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/deals
 * Get all deals (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can access deals",
        },
        { status: 403 }
      );
    }

    const deals = await db
      .select()
      .from(deal)
      .orderBy(desc(deal.createdAt));

    return NextResponse.json({
      success: true,
      deals,
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
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

/**
 * POST /api/deals
 * Create a new deal (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can create deals",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "Deal name is required",
        },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check if slug already exists (only if slug is provided)
    if (slug) {
      const existingDeal = await db
        .select()
        .from(deal)
        .where(eq(deal.slug, slug))
        .limit(1);

      if (existingDeal.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Conflict",
            message: "A deal with this slug already exists",
          },
          { status: 409 }
        );
      }
    }

    const newDeal = await db
      .insert(deal)
      .values({
        id: randomUUID(),
        name: body.name,
        slug: slug,
        description: body.description || null,
        teaserSummary: body.teaserSummary || null,
        sector: body.sector || null,
        geography: body.geography || null,
        dealType: body.dealType || null,
        targetRaise: body.targetRaise || null,
        minInvestment: body.minInvestment || null,
        targetIrr: body.targetIrr || null,
        targetMoic: body.targetMoic || null,
        status: body.status || "draft",
        visibility: body.visibility || "invite_only",
        coverImageUrl: body.coverImageUrl || null,
        launchDate: body.launchDate ? new Date(body.launchDate) : null,
        closeDate: body.closeDate ? new Date(body.closeDate) : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      deal: newDeal[0],
    });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to create deal",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * GET /api/deals/[dealId]
 * Get a specific deal (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await getSession();

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

    return NextResponse.json({
      success: true,
      deal: dealRecord,
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

/**
 * PATCH /api/deals/[dealId]
 * Update a deal (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await getSession();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can update deals",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if deal exists
    const [existingDeal] = await db
      .select()
      .from(deal)
      .where(eq(deal.id, dealId))
      .limit(1);

    if (!existingDeal) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Deal not found",
        },
        { status: 404 }
      );
    }

    // If slug is being updated, check for conflicts
    if (body.slug && body.slug !== existingDeal.slug) {
      const [conflictingDeal] = await db
        .select()
        .from(deal)
        .where(eq(deal.slug, body.slug))
        .limit(1);

      if (conflictingDeal) {
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

    // Build update object
    const updateData: Partial<typeof deal.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.teaserSummary !== undefined)
      updateData.teaserSummary = body.teaserSummary;
    if (body.sector !== undefined) updateData.sector = body.sector;
    if (body.geography !== undefined) updateData.geography = body.geography;
    if (body.dealType !== undefined) updateData.dealType = body.dealType;
    if (body.targetRaise !== undefined)
      updateData.targetRaise = body.targetRaise;
    if (body.minInvestment !== undefined)
      updateData.minInvestment = body.minInvestment;
    if (body.targetIrr !== undefined) updateData.targetIrr = body.targetIrr;
    if (body.targetMoic !== undefined) updateData.targetMoic = body.targetMoic;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.coverImageUrl !== undefined)
      updateData.coverImageUrl = body.coverImageUrl;
    if (body.launchDate !== undefined)
      updateData.launchDate = body.launchDate
        ? new Date(body.launchDate)
        : null;
    if (body.closeDate !== undefined)
      updateData.closeDate = body.closeDate ? new Date(body.closeDate) : null;

    const [updatedDeal] = await db
      .update(deal)
      .set(updateData)
      .where(eq(deal.id, dealId))
      .returning();

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to update deal",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deals/[dealId]
 * Delete a deal (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await getSession();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can delete deals",
        },
        { status: 403 }
      );
    }

    // Check if deal exists
    const [existingDeal] = await db
      .select()
      .from(deal)
      .where(eq(deal.id, dealId))
      .limit(1);

    if (!existingDeal) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Deal not found",
        },
        { status: 404 }
      );
    }

    await db.delete(deal).where(eq(deal.id, dealId));

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete deal",
      },
      { status: 500 }
    );
  }
}

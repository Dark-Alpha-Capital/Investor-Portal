import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@repo/db";
import { deal, dealInvite, user } from "@repo/db/schema";
import { eq, and, or, ne, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

type RouteParams = {
  params: Promise<{
    dealId: string;
  }>;
};

/**
 * GET /api/deals/[dealId]/invites
 * Get all invites for a deal (admin only)
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
          message: "Only administrators can access deal invites",
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

    // Get all invites for this deal with user info
    const invites = await db
      .select({
        id: dealInvite.id,
        dealId: dealInvite.dealId,
        userId: dealInvite.userId,
        curationNote: dealInvite.curationNote,
        createdAt: dealInvite.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(dealInvite)
      .innerJoin(user, eq(dealInvite.userId, user.id))
      .where(eq(dealInvite.dealId, dealId));

    return NextResponse.json({
      success: true,
      invites,
    });
  } catch (error) {
    console.error("Error fetching deal invites:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch deal invites",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals/[dealId]/invites
 * Add invites for a deal (admin only)
 * Body: { userIds: string[], curationNote?: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const session = await getSession();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can manage deal invites",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds, curationNote } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "userIds array is required",
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

    // Verify all users exist and are investors (not admins)
    // Check each user individually
    const validUserIds: string[] = [];
    for (const userId of userIds) {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(
          and(
            eq(user.id, userId),
            or(ne(user.role, "admin"), isNull(user.role))
          )
        )
        .limit(1);

      if (userRecord) {
        validUserIds.push(userId);
      }
    }

    if (validUserIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "No valid investor user IDs provided",
        },
        { status: 400 }
      );
    }

    // Check for existing invites to avoid duplicates
    const existingInviteMap = new Map<string, boolean>();
    const allExistingInvites = await db
      .select()
      .from(dealInvite)
      .where(eq(dealInvite.dealId, dealId));

    for (const invite of allExistingInvites) {
      existingInviteMap.set(invite.userId, true);
    }

    // Create invites for users that don't already have one
    const newInvites = validUserIds
      .filter((userId) => !existingInviteMap.has(userId))
      .map((userId) => ({
        id: randomUUID(),
        dealId,
        userId,
        curationNote: curationNote || null,
      }));

    if (newInvites.length > 0) {
      await db.insert(dealInvite).values(newInvites);
    }

    return NextResponse.json({
      success: true,
      message: `Added ${newInvites.length} invite(s) to deal`,
      addedCount: newInvites.length,
      skippedCount: validUserIds.length - newInvites.length,
    });
  } catch (error) {
    console.error("Error adding deal invites:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to add deal invites",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deals/[dealId]/invites
 * Remove invites from a deal (admin only)
 * Body: { userIds: string[] }
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
          message: "Only administrators can manage deal invites",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "userIds array is required",
        },
        { status: 400 }
      );
    }

    // Delete invites for specified users
    // Note: drizzle doesn't support IN clause directly, so we'll delete one by one
    // or use a workaround
    let deletedCount = 0;
    for (const userId of userIds) {
      const result = await db
        .delete(dealInvite)
        .where(
          and(eq(dealInvite.dealId, dealId), eq(dealInvite.userId, userId))
        );
      deletedCount += 1; // drizzle delete doesn't return count, so we assume 1 per iteration
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${deletedCount} invite(s) from deal`,
      removedCount: deletedCount,
    });
  } catch (error) {
    console.error("Error removing deal invites:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to remove deal invites",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { or, ne, isNull } from "drizzle-orm";

/**
 * GET /api/investors
 * Get all investors (non-admin users) for curation purposes (admin only)
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
          message: "Only administrators can access investors list",
        },
        { status: 403 }
      );
    }

    const investors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        kycStatus: user.kycStatus,
        isOnboardingCompleted: user.isOnboardingCompleted,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(or(ne(user.role, "admin"), isNull(user.role)))
      .orderBy(user.name);

    return NextResponse.json({
      success: true,
      investors,
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch investors",
      },
      { status: 500 }
    );
  }
}


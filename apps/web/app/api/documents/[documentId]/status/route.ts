import { NextRequest, NextResponse } from "next/server";
import { authSession } from "@/app/(auth)/auth";
import { db } from "@repo/db";
import { onboardingDocument } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{
    documentId: string;
  }>;
};

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "incorrect_doc"
  | "needs_revision";

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await authSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { documentId } = resolvedParams;
    const body = await request.json();
    const { status } = body;

    const validStatuses: DocumentStatus[] = [
      "pending",
      "approved",
      "rejected",
      "incorrect_doc",
      "needs_revision",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update document status
    const [updatedDocument] = await db
      .update(onboardingDocument)
      .set({
        status: status as DocumentStatus,
        reviewedAt: status !== "pending" ? new Date() : null,
        reviewedBy: status !== "pending" ? session.user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(onboardingDocument.id, documentId))
      .returning();

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}


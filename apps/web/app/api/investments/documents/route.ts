import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { investmentDocument, investment, deal } from "@repo/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/investments/documents
 * Get all investment documents (K-1s, Quarterly Reports, etc.) for the current user
 * Query params: investmentId (optional) - filter by specific investment
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
          message: "You must be logged in to view documents",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const investmentId = searchParams.get("investmentId");

    // Build where conditions - only get documents for investments owned by this user
    const whereConditions = [eq(investment.userId, session.user.id)];
    
    // Filter by specific investment if provided
    if (investmentId) {
      whereConditions.push(eq(investmentDocument.investmentId, investmentId));
    }

    // Build query - only get documents for investments owned by this user
    const documents = await db
      .select({
        id: investmentDocument.id,
        investmentId: investmentDocument.investmentId,
        documentType: investmentDocument.documentType,
        fileName: investmentDocument.fileName,
        fileSize: investmentDocument.fileSize,
        fileType: investmentDocument.fileType,
        fileUrl: investmentDocument.fileUrl,
        periodStart: investmentDocument.periodStart,
        periodEnd: investmentDocument.periodEnd,
        year: investmentDocument.year,
        uploadedAt: investmentDocument.uploadedAt,
        createdAt: investmentDocument.createdAt,
        dealName: deal.name,
        dealId: deal.id,
      })
      .from(investmentDocument)
      .innerJoin(investment, eq(investmentDocument.investmentId, investment.id))
      .innerJoin(deal, eq(investment.dealId, deal.id))
      .where(and(...whereConditions))
      .orderBy(desc(investmentDocument.uploadedAt));

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error fetching investment documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}


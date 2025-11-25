import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { onboardingDocument, onboarding } from "@repo/db/schema";
import { getSignedUrl } from "@/lib/storage";
import { eq } from "drizzle-orm";

/**
 * GET /api/documents/download
 * Proxies the download of a KYC document to handle CORS issues
 * Only accessible by admin users
 * Streams the file directly to the client
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to download documents",
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can download KYC documents",
        },
        { status: 403 }
      );
    }

    // Get document ID from query params
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "Document ID is required",
        },
        { status: 400 }
      );
    }

    // Get document from database
    const [document] = await db
      .select({
        id: onboardingDocument.id,
        fileUrl: onboardingDocument.fileUrl,
        fileName: onboardingDocument.fileName,
        fileType: onboardingDocument.fileType,
        onboardingId: onboardingDocument.onboardingId,
      })
      .from(onboardingDocument)
      .where(eq(onboardingDocument.id, documentId))
      .limit(1);

    if (!document || !document.fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Document not found or file URL is missing",
        },
        { status: 404 }
      );
    }

    // Verify the document belongs to a valid onboarding
    const [onboardingRecord] = await db
      .select({
        id: onboarding.id,
        userId: onboarding.userId,
      })
      .from(onboarding)
      .where(eq(onboarding.id, document.onboardingId))
      .limit(1);

    if (!onboardingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Onboarding record not found",
        },
        { status: 404 }
      );
    }

    // Generate signed URL with 15-minute expiration
    const signedUrl = await getSignedUrl(document.fileUrl, 15);

    if (!signedUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to generate signed URL",
        },
        { status: 500 }
      );
    }

    // Fetch the file from GCS using the signed URL
    const fileResponse = await fetch(signedUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to fetch file from storage",
        },
        { status: 500 }
      );
    }

    // Get the file content as a buffer
    const fileBuffer = await fileResponse.arrayBuffer();

    // Return the file with proper headers for download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "An error occurred while downloading the document",
      },
      { status: 500 }
    );
  }
}


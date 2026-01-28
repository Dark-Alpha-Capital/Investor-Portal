import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db";
import { onboardingDocument, onboarding } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { authSession } from "@/app/(auth)/auth";
import { createClient } from "webdav";

/**
 * GET /api/documents/download
 * Proxies the download of a KYC document from Nextcloud
 * Only accessible by admin users
 * Streams the file directly to the client
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await authSession();

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

    // Get document ID from query params - support both 'id' and 'documentId'
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id") || searchParams.get("documentId");

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
        filePath: onboardingDocument.filePath,
        fileUrl: onboardingDocument.fileUrl,
        fileName: onboardingDocument.fileName,
        fileType: onboardingDocument.fileType,
        onboardingId: onboardingDocument.onboardingId,
      })
      .from(onboardingDocument)
      .where(eq(onboardingDocument.id, documentId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Document not found",
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

    // Check if we have a file path (Nextcloud) or file URL (GCS)
    if (document.filePath) {
      // Fetch from Nextcloud
      if (
        !process.env.NEXTCLOUD_URL ||
        !process.env.NEXTCLOUD_USER ||
        !process.env.NEXTCLOUD_PASSWORD
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Configuration Error",
            message: "Nextcloud configuration is missing",
          },
          { status: 500 }
        );
      }

      const client = createClient(
        `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
        {
          username: process.env.NEXTCLOUD_USER,
          password: process.env.NEXTCLOUD_PASSWORD,
        }
      );

      // Check if file exists
      const exists = await client.exists(document.filePath);
      if (!exists) {
        return NextResponse.json(
          {
            success: false,
            error: "Not Found",
            message: "File not found in storage",
          },
          { status: 404 }
        );
      }

      // Fetch the file content
      const fileBuffer = (await client.getFileContents(
        document.filePath
      )) as Buffer;

      // Convert Buffer to Uint8Array for NextResponse compatibility
      const uint8Array = new Uint8Array(fileBuffer);

      // Return the file with proper headers for download
      return new NextResponse(uint8Array, {
        headers: {
          "Content-Type": document.fileType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName || "document")}"`,
          "Content-Length": fileBuffer.byteLength.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } else if (document.fileUrl) {
      // Fallback to GCS if fileUrl exists
      const { getSignedUrl } = await import("@/lib/storage");
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

      const fileBuffer = await fileResponse.arrayBuffer();

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": document.fileType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName || "document")}"`,
          "Content-Length": fileBuffer.byteLength.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "No file path or URL available for this document",
        },
        { status: 404 }
      );
    }
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

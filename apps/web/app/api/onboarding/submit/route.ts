import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
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
          message: "You must be logged in to submit onboarding data",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();

    // Parse investor data
    let investorData: Record<string, unknown> | null = null;
    const filesToProcess: Array<{
      documentType: string;
      name: string;
      type: string;
      size: number;
      buffer: string; // base64 encoded
    }> = [];

    // Extract all form fields
    for (const [key, value] of formData.entries()) {
      // Check if value is a File
      if (
        value &&
        typeof value === "object" &&
        "name" in value &&
        "size" in value
      ) {
        // Convert File to base64 buffer
        const file = value as File;
        if (file.size === 0) continue; // Skip empty files

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Buffer = buffer.toString("base64");

        filesToProcess.push({
          documentType: key,
          name: file.name,
          type: file.type,
          size: file.size,
          buffer: base64Buffer,
        });
      } else {
        // Parse investor data JSON
        if (key === "investorData") {
          try {
            investorData = JSON.parse(value as string);
          } catch {
            return NextResponse.json(
              {
                success: false,
                error: "Invalid investor data format",
                message: "Failed to parse investor data",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    if (!investorData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing data",
          message: "Investor data is required",
        },
        { status: 400 }
      );
    }

    // Forward request to server
    const serverResponse = await fetch(`${SERVER_URL}/api/onboarding/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        investorData,
        files: filesToProcess,
      }),
    });

    const responseData = await serverResponse.json();

    if (!serverResponse.ok) {
      return NextResponse.json(responseData, { status: serverResponse.status });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error forwarding onboarding submission to server:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process submission",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

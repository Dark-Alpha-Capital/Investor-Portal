import { createFileRoute } from "@tanstack/react-router";
import { authSession } from "@/lib/auth-session-from-request";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080";

export const Route = createFileRoute("/api/onboarding/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = await authSession();

          if (!session?.user) {
            return Response.json(
              {
                success: false,
                error: "Unauthorized",
                message: "You must be logged in to submit onboarding data",
              },
              { status: 401 },
            );
          }

          const userId = session.user.id;
          const formData = await request.formData();

          let investorData: Record<string, unknown> | null = null;
          const filesToProcess: Array<{
            documentType: string;
            name: string;
            type: string;
            size: number;
            buffer: string;
          }> = [];

          for (const [key, value] of formData.entries()) {
            if (
              value &&
              typeof value === "object" &&
              "name" in value &&
              "size" in value
            ) {
              const file = value as File;
              if (file.size === 0) continue;

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
            } else if (key === "investorData") {
              try {
                investorData = JSON.parse(value as string);
              } catch {
                return Response.json(
                  {
                    success: false,
                    error: "Invalid investor data format",
                    message: "Failed to parse investor data",
                  },
                  { status: 400 },
                );
              }
            }
          }

          if (!investorData) {
            return Response.json(
              {
                success: false,
                error: "Missing data",
                message: "Investor data is required",
              },
              { status: 400 },
            );
          }

          const serverResponse = await fetch(
            `${SERVER_URL}/api/onboarding/submit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                investorData,
                files: filesToProcess,
              }),
            },
          );

          const responseData = await serverResponse.json();

          if (!serverResponse.ok) {
            return Response.json(responseData, {
              status: serverResponse.status,
            });
          }

          return Response.json(responseData, { status: 200 });
        } catch (error) {
          console.error(
            "Error forwarding onboarding submission to server:",
            error,
          );
          return Response.json(
            {
              success: false,
              error: "Failed to process submission",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

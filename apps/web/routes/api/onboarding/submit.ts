import { createFileRoute } from "@tanstack/react-router";
import { TRPCError } from "@trpc/server";
import { authSession } from "@/lib/auth-session-from-request";
import { onboardingSubmitSchema } from "@/trpc/routers/onboarding";
import { getTrpcCaller } from "@/trpc/caller-from-request";

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

          const formData = await request.formData();

          let investorData: unknown = null;
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

          if (investorData === null || typeof investorData !== "object") {
            return Response.json(
              {
                success: false,
                error: "Missing data",
                message: "Investor data is required",
              },
              { status: 400 },
            );
          }

          const validated = onboardingSubmitSchema.safeParse({
            investorData,
            files: filesToProcess,
          });
          if (!validated.success) {
            return Response.json(
              {
                success: false,
                error: "Validation failed",
                message: "Onboarding payload failed validation",
                issues: validated.error.flatten(),
              },
              { status: 400 },
            );
          }

          const caller = await getTrpcCaller();
          const responseData = await caller.onboarding.submit(validated.data);

          return Response.json(responseData, { status: 200 });
        } catch (error) {
          if (error instanceof TRPCError) {
            return Response.json(
              {
                success: false,
                error: error.code,
                message: error.message,
              },
              { status:
                error.code === "UNAUTHORIZED"
                  ? 401
                  : error.code === "FORBIDDEN"
                    ? 403
                    : error.code === "NOT_FOUND"
                      ? 404
                      : error.code === "BAD_REQUEST"
                        ? 400
                        : 500 },
            );
          }

          console.error("Error processing onboarding submission:", error);
          return Response.json(
            {
              success: false,
              error: "Failed to process submission",
              message: "An unexpected error occurred. Please try again later.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

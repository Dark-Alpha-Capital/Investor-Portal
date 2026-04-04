import { createFileRoute } from "@tanstack/react-router";
import { revalidateTag } from "next/cache";

export const Route = createFileRoute("/api/revalidate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const configuredSecret = process.env.REVALIDATE_SECRET;

        if (!configuredSecret) {
          return Response.json(
            { error: "Revalidate secret is not configured" },
            { status: 500 },
          );
        }

        const { searchParams } = new URL(request.url);
        const querySecret = searchParams.get("secret");
        const headerSecret = request.headers.get("x-revalidate-secret");
        const authHeader = request.headers.get("authorization");
        const bearerSecret = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;
        const providedSecret = querySecret ?? headerSecret ?? bearerSecret;

        if (!providedSecret || providedSecret !== configuredSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        revalidateTag("prismic", "default");

        return Response.json({ revalidated: true, now: Date.now() });
      },
    },
  },
});

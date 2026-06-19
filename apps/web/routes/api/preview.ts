import { createFileRoute } from "@tanstack/react-router";
import { redirectToPreviewURL } from "@/lib/prismic-preview";
import { createClient } from "@/prismicio";

export const Route = createFileRoute("/api/preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const client = createClient();
        return redirectToPreviewURL({ client, request });
      },
    },
  },
});

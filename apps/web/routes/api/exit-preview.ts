import { createFileRoute } from "@tanstack/react-router";
import { exitPreviewResponse } from "@/lib/prismic-preview";

export const Route = createFileRoute("/api/exit-preview")({
  server: {
    handlers: {
      GET: () => exitPreviewResponse(),
    },
  },
});

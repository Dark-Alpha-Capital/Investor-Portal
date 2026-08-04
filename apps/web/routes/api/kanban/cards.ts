import { createFileRoute } from "@tanstack/react-router";
import { requireAdminApiSession } from "@/lib/auth/require-admin-api";
import {
  isDealLifecycleStatus,
  type DealLifecycleStatus,
} from "@repo/db/deal-status";
import {
  getDealKanbanColumnPage,
  KANBAN_PAGE_SIZE_DEFAULT,
} from "@repo/db/deal-kanban-queries";

function parseLimit(value: string | null): number {
  if (!value) {
    return KANBAN_PAGE_SIZE_DEFAULT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return KANBAN_PAGE_SIZE_DEFAULT;
  }

  return Math.min(Math.max(parsed, 1), 40);
}

export const Route = createFileRoute("/api/kanban/cards")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const guarded = await requireAdminApiSession();
          if (!guarded.ok) {
            return guarded.response;
          }

          const url = new URL(request.url);
          const statusParam = url.searchParams.get("status");

          if (!statusParam || !isDealLifecycleStatus(statusParam)) {
            return Response.json(
              { error: "Invalid or missing status parameter" },
              { status: 400 },
            );
          }

          const statusFilter = url.searchParams.getAll("statusFilter").filter(Boolean);
          const search = url.searchParams.get("search") ?? undefined;

          const page = await getDealKanbanColumnPage(
            statusParam as DealLifecycleStatus,
            {
              search,
              statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
            },
            url.searchParams.get("cursor") ?? undefined,
            parseLimit(url.searchParams.get("limit")),
          );

          return Response.json(page);
        } catch (error) {
          console.error("Error in /api/kanban/cards", error);
          return Response.json(
            { error: "Internal server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});

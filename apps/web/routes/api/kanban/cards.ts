import { createFileRoute } from "@tanstack/react-router";
import { authSession } from "@/lib/auth/session-from-request";
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
          const session = await authSession();

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          if (session.user.role !== "admin") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
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

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { adminOnlyServerFnMiddleware } from "@/lib/middleware/admin-only-server-fn";
import { getAdminDeals } from "@repo/db/queries";
import { getDealKanbanFilteredTotalCount } from "@repo/db/deal-kanban-queries";
import { isDealLifecycleStatus } from "@repo/db/deal-status";

export const dealsIndexSearchSchema = z.object({
  view: z.enum(["kanban", "table"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type DealsIndexSearch = z.infer<typeof dealsIndexSearchSchema>;

export type DealsIndexDeal = Awaited<
  ReturnType<typeof getAdminDeals>
>["deals"][number];

export type DealsIndexData = {
  deals: DealsIndexDeal[];
  currentPage: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasFilters: boolean;
};

const TABLE_PAGE_SIZE = 50;

function normalizeStatusFilter(
  status: string | undefined,
): string[] | undefined {
  if (!status || status === "all") {
    return undefined;
  }
  if (isDealLifecycleStatus(status)) {
    return [status];
  }
  return undefined;
}

export const loadDealsIndex = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((data: unknown) => dealsIndexSearchSchema.parse(data))
  .handler(async ({ data: deps }): Promise<DealsIndexData> => {
    const limit = TABLE_PAGE_SIZE;
    const currentPage = deps.page ?? 1;
    const isKanbanView = (deps.view ?? "kanban") !== "table";
    const statusFilter = normalizeStatusFilter(deps.status);

    const hasFilters = Boolean(deps.search?.trim() || statusFilter?.length);

    if (isKanbanView) {
      const totalCount = await getDealKanbanFilteredTotalCount({
        search: deps.search,
        statusFilter,
      });

      return {
        deals: [],
        currentPage: 1,
        limit,
        totalCount,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        hasFilters,
      };
    }

    const result = await getAdminDeals({
      page: currentPage,
      limit,
      search: deps.search,
      status: statusFilter?.[0],
    });

    const totalCount = result.pagination.totalCount;
    const totalPages = Math.max(1, result.pagination.totalPages);

    return {
      deals: result.deals,
      currentPage: result.pagination.page,
      limit: result.pagination.limit,
      totalCount,
      totalPages,
      hasNextPage: result.pagination.hasNextPage,
      hasPreviousPage: result.pagination.hasPrevPage,
      hasFilters,
    };
  });

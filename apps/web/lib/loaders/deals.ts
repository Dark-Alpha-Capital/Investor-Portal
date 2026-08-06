import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { adminOnlyServerFnMiddleware } from "@/lib/middleware/admin-only-server-fn";
import {
  getAdminDeals,
  getAdminDealFilterOptions,
} from "@repo/db/queries";
import { getDealKanbanFilteredTotalCount } from "@repo/db/deal-kanban-queries";
import { isDealLifecycleStatus } from "@repo/db/deal-status";

export const dealsIndexSearchSchema = z.object({
  view: z.enum(["kanban", "table"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  deleted: z.enum(["only", "all"]).optional(),
  sector: z.string().optional(),
  geography: z.string().optional(),
  dealType: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
  launchDateFrom: z.string().optional(),
  launchDateTo: z.string().optional(),
  closeDateFrom: z.string().optional(),
  closeDateTo: z.string().optional(),
  targetRaiseMin: z.coerce.number().optional(),
  targetRaiseMax: z.coerce.number().optional(),
  minInvestmentMin: z.coerce.number().optional(),
  minInvestmentMax: z.coerce.number().optional(),
  targetIrrMin: z.coerce.number().optional(),
  targetIrrMax: z.coerce.number().optional(),
  targetMoicMin: z.coerce.number().optional(),
  targetMoicMax: z.coerce.number().optional(),
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

export type DealFilterOptions = Awaited<
  ReturnType<typeof getAdminDealFilterOptions>
>;

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

/**
 * Convert a "YYYY-MM-DD" date string to unix ms. `endOfDay` pins the boundary
 * to the end of that UTC day so inclusive date-range filters behave.
 */
export function parseDateBoundary(
  value: string | undefined,
  endOfDay: boolean,
): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return undefined;
  }
  const base = Date.UTC(year, month - 1, day);
  return endOfDay ? base + 86_400_000 - 1 : base;
}

export const loadDealsIndex = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((data: unknown) => dealsIndexSearchSchema.parse(data))
  .handler(async ({ data: deps }): Promise<DealsIndexData> => {
    const limit = TABLE_PAGE_SIZE;
    const currentPage = deps.page ?? 1;
    const isKanbanView = (deps.view ?? "kanban") !== "table";
    const statusFilter = normalizeStatusFilter(deps.status);
    const deletedFilter = deps.deleted;

    const createdAtFrom = parseDateBoundary(deps.createdAtFrom, false);
    const createdAtTo = parseDateBoundary(deps.createdAtTo, true);
    const launchDateFrom = parseDateBoundary(deps.launchDateFrom, false);
    const launchDateTo = parseDateBoundary(deps.launchDateTo, true);
    const closeDateFrom = parseDateBoundary(deps.closeDateFrom, false);
    const closeDateTo = parseDateBoundary(deps.closeDateTo, true);

    const hasFilters = Boolean(
      deps.search?.trim() ||
        statusFilter?.length ||
        deletedFilter ||
        deps.sector ||
        deps.geography ||
        deps.dealType ||
        createdAtFrom != null ||
        createdAtTo != null ||
        launchDateFrom != null ||
        launchDateTo != null ||
        closeDateFrom != null ||
        closeDateTo != null ||
        deps.targetRaiseMin != null ||
        deps.targetRaiseMax != null ||
        deps.minInvestmentMin != null ||
        deps.minInvestmentMax != null ||
        deps.targetIrrMin != null ||
        deps.targetIrrMax != null ||
        deps.targetMoicMin != null ||
        deps.targetMoicMax != null,
    );

    const numericFilters = {
      targetRaiseMin: deps.targetRaiseMin,
      targetRaiseMax: deps.targetRaiseMax,
      minInvestmentMin: deps.minInvestmentMin,
      minInvestmentMax: deps.minInvestmentMax,
      targetIrrMin: deps.targetIrrMin,
      targetIrrMax: deps.targetIrrMax,
      targetMoicMin: deps.targetMoicMin,
      targetMoicMax: deps.targetMoicMax,
    };

    const kanbanFilters = {
      search: deps.search,
      statusFilter,
      sector: deps.sector,
      geography: deps.geography,
      dealType: deps.dealType,
      createdAtFrom,
      createdAtTo,
      launchDateFrom,
      launchDateTo,
      closeDateFrom,
      closeDateTo,
      ...numericFilters,
    };

    if (isKanbanView) {
      const totalCount = await getDealKanbanFilteredTotalCount(kanbanFilters);

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
      deleted: deletedFilter,
      sector: deps.sector,
      geography: deps.geography,
      dealType: deps.dealType,
      createdAtFrom,
      createdAtTo,
      launchDateFrom,
      launchDateTo,
      closeDateFrom,
      closeDateTo,
      ...numericFilters,
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

export const loadDealFilterOptions = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .handler(async (): Promise<DealFilterOptions> => getAdminDealFilterOptions());

import { db } from ".";
import { deal } from "./schema";
import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  decodeKanbanCursor,
  encodeKanbanCursor,
} from "./kanban-cursor";
import {
  isDealLifecycleStatus,
  kanbanColumnMatchesStatusFilter,
  type DealLifecycleStatus,
} from "./deal-status";

export type DealKanbanCard = {
  id: string;
  name: string;
  status: DealLifecycleStatus;
  sector: string | null;
  targetRaise: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type DealKanbanFilters = {
  search?: string;
  statusFilter?: string[];
};

export type DealKanbanColumnPage = {
  items: DealKanbanCard[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
};

export const KANBAN_PAGE_SIZE_DEFAULT = 30;

/** SQLite/D1 has no ILIKE — use lower() + LIKE. */
function dealSearchCondition(raw: string): SQL {
  const pattern = `%${raw.trim().toLowerCase()}%`;
  return or(
    sql`lower(${deal.name}) like ${pattern}`,
    sql`lower(coalesce(${deal.description}, '')) like ${pattern}`,
    sql`lower(coalesce(${deal.sector}, '')) like ${pattern}`,
  )!;
}

function buildSharedConditions(filters: DealKanbanFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.search?.trim()) {
    conditions.push(dealSearchCondition(filters.search));
  }

  return conditions;
}

function mapDealRow(row: typeof deal.$inferSelect): DealKanbanCard {
  const sortAt = row.updatedAt ?? row.createdAt;
  return {
    id: row.id,
    name: row.name,
    status: row.status as DealLifecycleStatus,
    sector: row.sector,
    targetRaise: row.targetRaise?.toString() ?? null,
    targetIrr: row.targetIrr?.toString() ?? null,
    targetMoic: row.targetMoic?.toString() ?? null,
    coverImageUrl: row.coverImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: sortAt.toISOString(),
  };
}

export async function getDealKanbanColumnPage(
  columnStatus: DealLifecycleStatus,
  filters: DealKanbanFilters = {},
  cursor?: string,
  limit: number = KANBAN_PAGE_SIZE_DEFAULT,
): Promise<DealKanbanColumnPage> {
  if (!kanbanColumnMatchesStatusFilter(columnStatus, filters.statusFilter)) {
    return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
  }

  const decodedCursor = cursor ? decodeKanbanCursor(cursor) : null;
  if (cursor && !decodedCursor) {
    return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
  }

  try {
    const baseConditions: SQL[] = [
      eq(deal.status, columnStatus),
      ...buildSharedConditions(filters),
    ];

    const countWhere = and(...baseConditions);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deal)
      .where(countWhere);

    const totalCount = Number(countResult?.count ?? 0);

    const pageConditions: SQL[] = [...baseConditions];
    if (decodedCursor) {
      // D1 stores timestamps as unix ms integers — cursor must match that form.
      const cursorMs = Number(decodedCursor.updatedAt);
      if (!Number.isFinite(cursorMs)) {
        return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
      }
      // (sortAt DESC, id DESC) — next page is strictly older than the cursor
      pageConditions.push(
        sql`(
          coalesce(${deal.updatedAt}, ${deal.createdAt}) < ${cursorMs}
          OR (
            coalesce(${deal.updatedAt}, ${deal.createdAt}) = ${cursorMs}
            AND ${deal.id} < ${decodedCursor.id}
          )
        )`,
      );
    }

    const rows = await db
      .select()
      .from(deal)
      .where(and(...pageConditions))
      .orderBy(
        desc(sql`coalesce(${deal.updatedAt}, ${deal.createdAt})`),
        desc(deal.id),
      )
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const items = pageRows.map(mapDealRow);

    const lastRow = pageRows.at(-1);
    const nextCursor =
      hasMore && lastRow
        ? encodeKanbanCursor({
            updatedAt: String(
              (lastRow.updatedAt ?? lastRow.createdAt).getTime(),
            ),
            id: lastRow.id,
          })
        : null;

    return { items, nextCursor, hasMore, totalCount };
  } catch (error) {
    console.error("Error fetching deal kanban column", error);
    return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
  }
}

export async function getDealKanbanFilteredTotalCount(
  filters: DealKanbanFilters = {},
): Promise<number> {
  try {
    const conditions = buildSharedConditions(filters);

    if (filters.statusFilter?.length) {
      const valid = filters.statusFilter.filter(isDealLifecycleStatus);
      if (valid.length === 0) {
        return 0;
      }
      conditions.push(inArray(deal.status, valid));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deal)
      .where(whereCondition);

    return Number(countResult?.count ?? 0);
  } catch (error) {
    console.error("Error fetching deal kanban filtered total count", error);
    return 0;
  }
}

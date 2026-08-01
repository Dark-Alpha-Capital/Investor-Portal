import type { DealLifecycleStatus } from "@repo/db/deal-status";

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

export type KanbanPage = {
  items: DealKanbanCard[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
};

export type KanbanFilters = {
  search?: string;
  status?: string[];
};

export const KANBAN_COLUMN_PAGE_SIZE = 30;

export function buildKanbanCardsUrl(
  status: DealLifecycleStatus,
  filters: KanbanFilters = {},
  cursor?: string,
  limit: number = KANBAN_COLUMN_PAGE_SIZE,
): string {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  filters.status?.forEach((value) => params.append("statusFilter", value));

  return `/api/kanban/cards?${params.toString()}`;
}

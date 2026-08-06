import type { DealLifecycleStatus } from "@repo/db/deal-status";

export type DealKanbanCard = {
  id: string;
  name: string;
  status: DealLifecycleStatus;
  sector: string | null;
  targetRaise: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
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
  sector?: string;
  geography?: string;
  dealType?: string;
  createdAtFrom?: number;
  createdAtTo?: number;
  launchDateFrom?: number;
  launchDateTo?: number;
  closeDateFrom?: number;
  closeDateTo?: number;
  targetRaiseMin?: number;
  targetRaiseMax?: number;
  minInvestmentMin?: number;
  minInvestmentMax?: number;
  targetIrrMin?: number;
  targetIrrMax?: number;
  targetMoicMin?: number;
  targetMoicMax?: number;
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

  const scalarParams: [keyof KanbanFilters, string][] = [
    ["sector", "sector"],
    ["geography", "geography"],
    ["dealType", "dealType"],
    ["createdAtFrom", "createdAtFrom"],
    ["createdAtTo", "createdAtTo"],
    ["launchDateFrom", "launchDateFrom"],
    ["launchDateTo", "launchDateTo"],
    ["closeDateFrom", "closeDateFrom"],
    ["closeDateTo", "closeDateTo"],
    ["targetRaiseMin", "targetRaiseMin"],
    ["targetRaiseMax", "targetRaiseMax"],
    ["minInvestmentMin", "minInvestmentMin"],
    ["minInvestmentMax", "minInvestmentMax"],
    ["targetIrrMin", "targetIrrMin"],
    ["targetIrrMax", "targetIrrMax"],
    ["targetMoicMin", "targetMoicMin"],
    ["targetMoicMax", "targetMoicMax"],
  ];

  for (const [key, param] of scalarParams) {
    const value = filters[key];
    if (value !== undefined && value !== null) {
      params.set(param, String(value));
    }
  }

  return `/api/kanban/cards?${params.toString()}`;
}

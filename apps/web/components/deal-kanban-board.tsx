import {
  dealLifecycleStatuses,
  type DealLifecycleStatus,
} from "@repo/db/deal-status";
import { DealKanbanColumn } from "@/components/deal-kanban-column";
import type { KanbanFilters } from "@/lib/kanban/types";

interface DealKanbanBoardProps {
  filters: KanbanFilters;
}

export function DealKanbanBoard({ filters }: DealKanbanBoardProps) {
  return (
    <div className="w-full min-w-0 h-[calc(100vh-14rem)] min-h-[420px] overflow-x-auto overscroll-x-contain">
      <div className="flex h-full w-max gap-3 md:gap-4 pb-4 pe-6 items-stretch">
        {dealLifecycleStatuses.map((status: DealLifecycleStatus) => (
          <DealKanbanColumn key={status} status={status} filters={filters} />
        ))}
      </div>
    </div>
  );
}

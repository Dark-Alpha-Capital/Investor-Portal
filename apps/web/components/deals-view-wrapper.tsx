import { Columns3, List, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DealKanbanBoard } from "@/components/deal-kanban-board";
import { DealsTable } from "@/components/deals-table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DealsIndexData } from "@/lib/loaders/deals";
import type { KanbanFilters } from "@/lib/kanban/types";

type DealViewMode = "kanban" | "table";

interface DealsViewWrapperProps {
  viewMode: DealViewMode;
  onViewModeChange: (mode: DealViewMode) => void;
  data: DealsIndexData;
  kanbanFilters: KanbanFilters;
  onPageChange: (page: number) => void;
}

export function DealsViewWrapper({
  viewMode,
  onViewModeChange,
  data,
  kanbanFilters,
  onPageChange,
}: DealsViewWrapperProps) {
  const isTableView = viewMode === "table";
  const isKanbanEmpty = !isTableView && data.totalCount === 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex items-center justify-end">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value === "kanban" || value === "table") {
              onViewModeChange(value);
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban view">
            <Columns3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="min-w-0 w-full overflow-hidden">
        {isKanbanEmpty ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              {data.hasFilters
                ? "No deals match your filters. Try adjusting your search criteria."
                : "No deals found. Create your first deal to get started."}
            </p>
            {!data.hasFilters ? (
              <Link to="/admin/deals/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Deal
                </Button>
              </Link>
            ) : null}
          </div>
        ) : isTableView ? (
          <DealsTable
            deals={data.deals}
            currentPage={data.currentPage}
            limit={data.limit}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            hasFilters={data.hasFilters}
            onPageChange={onPageChange}
          />
        ) : (
          <DealKanbanBoard filters={kanbanFilters} />
        )}
      </div>
    </div>
  );
}

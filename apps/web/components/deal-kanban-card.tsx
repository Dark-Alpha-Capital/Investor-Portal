import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DealKanbanCard } from "@/lib/kanban/types";
import { dealLifecycleStatusLabels } from "@repo/db/deal-status";

const formatCurrency = (value: string | null) => {
  if (value === null || value === undefined) return null;
  const numValue = parseFloat(value);
  if (Number.isNaN(numValue)) return null;
  if (numValue >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
  }
  if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(0)}K`;
  }
  return `$${numValue.toLocaleString()}`;
};

type DealKanbanCardProps = {
  deal: DealKanbanCard;
};

function DealKanbanCardInner({ deal }: DealKanbanCardProps) {
  const raise = formatCurrency(deal.targetRaise);

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-3 min-w-0 hover:shadow-md transition-shadow">
      <div className="min-w-0">
        <Link
          to="/admin/deals/$dealId"
          params={{ dealId: deal.id }}
          className="font-semibold text-sm leading-tight wrap-break-word hover:underline"
        >
          {deal.name}
        </Link>
        {deal.sector ? (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {deal.sector}
          </p>
        ) : null}
      </div>

      {raise || deal.targetIrr ? (
        <div className="flex flex-wrap gap-1.5">
          {raise ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-muted text-muted-foreground">
              {raise}
            </span>
          ) : null}
          {deal.targetIrr ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-muted text-muted-foreground">
              IRR {deal.targetIrr}%
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="sr-only">
        {dealLifecycleStatusLabels[deal.status]}
      </p>

      <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" asChild>
              <Link
                to="/admin/deals/$dealId"
                params={{ dealId: deal.id }}
                aria-label={`View ${deal.name}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" asChild>
              <Link
                to="/admin/deals/$dealId/curate"
                params={{ dealId: deal.id }}
                aria-label={`Curate ${deal.name}`}
              >
                <Users className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Curate</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" asChild>
              <Link
                to="/admin/deals/$dealId/edit"
                params={{ dealId: deal.id }}
                aria-label={`Edit ${deal.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export const DealKanbanCardView = memo(DealKanbanCardInner);

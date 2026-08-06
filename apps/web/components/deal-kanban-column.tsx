import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { Columns3, Loader2 } from "lucide-react";
import { DealKanbanCardView } from "@/components/deal-kanban-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  dealLifecycleStatusLabels,
  type DealLifecycleStatus,
} from "@repo/db/deal-status";
import {
  buildKanbanCardsUrl,
  KANBAN_COLUMN_PAGE_SIZE,
  type KanbanFilters,
  type KanbanPage,
} from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

const COLUMN_SURFACE: Record<DealLifecycleStatus, string> = {
  draft: "bg-slate-100/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/60",
  coming_soon:
    "bg-sky-50/90 dark:bg-sky-950/40 border-sky-200/70 dark:border-sky-800/50",
  live: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/50",
  closing:
    "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/50",
  funded:
    "bg-teal-50/90 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-800/50",
  exited:
    "bg-zinc-100/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-700/60",
  cancelled:
    "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-800/50",
};

async function fetchKanbanColumnPage(url: string): Promise<KanbanPage> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to load kanban column");
  }

  return response.json() as Promise<KanbanPage>;
}

function normalizeKanbanFilters(filters: KanbanFilters) {
  return {
    search: filters.search || undefined,
    status: filters.status?.length ? filters.status : undefined,
    sector: filters.sector || undefined,
    geography: filters.geography || undefined,
    dealType: filters.dealType || undefined,
    createdAtFrom: filters.createdAtFrom,
    createdAtTo: filters.createdAtTo,
    launchDateFrom: filters.launchDateFrom,
    launchDateTo: filters.launchDateTo,
    closeDateFrom: filters.closeDateFrom,
    closeDateTo: filters.closeDateTo,
    targetRaiseMin: filters.targetRaiseMin,
    targetRaiseMax: filters.targetRaiseMax,
    minInvestmentMin: filters.minInvestmentMin,
    minInvestmentMax: filters.minInvestmentMax,
    targetIrrMin: filters.targetIrrMin,
    targetIrrMax: filters.targetIrrMax,
    targetMoicMin: filters.targetMoicMin,
    targetMoicMax: filters.targetMoicMax,
  };
}

function kanbanColumnQueryOptions(
  status: DealLifecycleStatus,
  filters: KanbanFilters = {},
  limit: number = KANBAN_COLUMN_PAGE_SIZE,
) {
  const normalized = normalizeKanbanFilters(filters);
  return infiniteQueryOptions({
    queryKey: ["kanban", status, normalized],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchKanbanColumnPage(
        buildKanbanCardsUrl(status, normalized, pageParam, limit),
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

interface DealKanbanColumnProps {
  status: DealLifecycleStatus;
  filters: KanbanFilters;
}

const SKELETON_COUNT = 5;

function KanbanCardSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-7 w-full" />
    </div>
  );
}

function DealKanbanColumnInner({ status, filters }: DealKanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const shortCircuited =
    Boolean(filters.status?.length) && !filters.status!.includes(status);

  const query = useInfiniteQuery({
    ...kanbanColumnQueryOptions(status, filters),
    enabled: !shortCircuited,
  });

  const allItems = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const totalCount = shortCircuited ? 0 : query.data?.pages[0]?.totalCount;

  const {
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = query;

  const onIntersect = useEffectEvent(() => {
    if (!isFetchingNextPage && hasNextPage) {
      void fetchNextPage();
    }
  });

  // IntersectionObserver for scroll-to-load
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel || !hasNextPage || shortCircuited) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      {
        root,
        rootMargin: "160px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, shortCircuited, allItems.length, onIntersect]);

  // If the column isn't tall enough to scroll, keep fetching until it is (or done)
  useEffect(() => {
    if (!hasNextPage || shortCircuited || isFetchingNextPage || isLoading) {
      return;
    }
    const root = scrollRef.current;
    if (!root) return;
    if (root.scrollHeight <= root.clientHeight + 8) {
      void fetchNextPage();
    }
  }, [
    hasNextPage,
    shortCircuited,
    isFetchingNextPage,
    isLoading,
    allItems.length,
    fetchNextPage,
  ]);

  const loadedCount = allItems.length;
  const label = dealLifecycleStatusLabels[status];

  return (
    <div
      className={cn(
        "w-64 shrink-0 lg:w-72 h-full flex flex-col gap-3 min-h-0 rounded-xl border p-3",
        COLUMN_SURFACE[status],
      )}
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Columns3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <h3 className="text-sm font-medium truncate">{label}</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {typeof totalCount === "number"
            ? `${loadedCount} / ${totalCount}`
            : loadedCount}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pe-1"
        role="list"
      >
        {shortCircuited ? (
          <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-md bg-muted/30">
            Filtered out
          </div>
        ) : isLoading ? (
          Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <KanbanCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : isError ? (
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load deals"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : loadedCount === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-md bg-muted/30">
            No deals
          </div>
        ) : (
          allItems.map((deal) => (
            <div key={deal.id} role="listitem">
              <DealKanbanCardView deal={deal} />
            </div>
          ))
        )}

        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading more...
          </div>
        ) : null}

        {!isLoading && !hasNextPage && loadedCount > 0 ? (
          <p className="py-2 text-center text-[0.65rem] text-muted-foreground">
            End of column
          </p>
        ) : null}

        <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
      </div>
    </div>
  );
}

export const DealKanbanColumn = memo(DealKanbanColumnInner);

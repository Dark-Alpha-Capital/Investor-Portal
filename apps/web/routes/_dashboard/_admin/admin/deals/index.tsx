import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealsViewWrapper } from "@/components/deals-view-wrapper";
import {
  dealsIndexSearchSchema,
  loadDealsIndex,
  type DealsIndexData,
  type DealsIndexSearch,
} from "@/lib/loaders/deals";
import {
  dealLifecycleStatuses,
  dealLifecycleStatusLabels,
} from "@repo/db/deal-status";

function parseDealsSearch(search: Record<string, unknown>): DealsIndexSearch {
  return dealsIndexSearchSchema.parse(search);
}

function normalizeIndexDeps(search: DealsIndexSearch) {
  return {
    view: search.view ?? "kanban",
    page: search.page ?? 1,
    search: search.search || undefined,
    status:
      search.status && search.status !== "all" ? search.status : undefined,
  };
}

function dealsIndexQueryOptions(deps: DealsIndexSearch) {
  return queryOptions({
    queryKey: ["deals", "index", normalizeIndexDeps(deps)],
    queryFn: async (): Promise<DealsIndexData> =>
      loadDealsIndex({ data: deps }),
    placeholderData: keepPreviousData,
  });
}

export const Route = createFileRoute("/_dashboard/_admin/admin/deals/")({
  validateSearch: parseDealsSearch,
  loader: async ({ context: { queryClient }, location }) => {
    const search = parseDealsSearch(location.search as Record<string, unknown>);
    await queryClient.ensureQueryData(dealsIndexQueryOptions(search));
  },
  component: AdminDealsRoutePage,
});

function DealsSearchField({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const debouncedChange = useDebouncedCallback((next: string) => {
    onValueChange(next);
  }, 300);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={draft ? "pl-9 pr-9" : "pl-9"}
        placeholder="Search deals..."
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          debouncedChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {draft ? (
        <Button
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={() => {
            setDraft("");
            debouncedChange.cancel();
            onValueChange("");
          }}
          variant="ghost"
          size="icon"
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      ) : null}
    </div>
  );
}

function AdminDealsRoutePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading, isFetching }: UseQueryResult<DealsIndexData> =
    useQuery(dealsIndexQueryOptions(search));

  const viewMode =
    search.deleted === "only" ? "table" : (search.view ?? "kanban");
  const status = search.status ?? "all";

  const kanbanFilters = {
    search: search.search,
    status: status !== "all" ? [status] : undefined,
  };

  if (isLoading && !data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Deals Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage investment deals
          </p>
        </div>
        <Link to="/admin/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <DealsSearchField
              value={search.search ?? ""}
              onValueChange={(value) => {
                void navigate({
                  search: (current) => ({
                    ...current,
                    search: value.trim() ? value : undefined,
                    page: 1,
                  }),
                });
              }}
            />

            <Select
              value={status}
              onValueChange={(value) => {
                void navigate({
                  search: (current) => ({
                    ...current,
                    status: value === "all" ? undefined : value,
                    page: 1,
                  }),
                });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {dealLifecycleStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {dealLifecycleStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={search.deleted === "only" ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                if (search.deleted === "only") {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      deleted: undefined,
                      page: 1,
                    }),
                  });
                } else {
                  void navigate({
                    search: (current) => ({
                      ...current,
                      deleted: "only",
                      view: "table",
                      page: 1,
                    }),
                  });
                }
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              {search.deleted === "only" ? "Show Active" : "Show Deleted"}
            </Button>

            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>

        <DealsViewWrapper
          viewMode={viewMode}
          onViewModeChange={(view) => {
            void navigate({
              search: (current) => ({
                ...current,
                view,
                ...(view === "table"
                  ? { page: current.page ?? 1 }
                  : { page: undefined }),
              }),
            });
          }}
          data={data}
          kanbanFilters={kanbanFilters}
          onPageChange={(page) => {
            void navigate({
              search: (current) => ({
                ...current,
                page,
              }),
            });
          }}
        />
      </div>
    </div>
  );
}

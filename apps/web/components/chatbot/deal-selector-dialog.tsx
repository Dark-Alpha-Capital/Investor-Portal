"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

export type DealSelectorOption = {
  id: string;
  name: string;
  status: string | null;
  sector: string | null;
  teaserSummary: string | null;
};

type DealSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDealId: string | null;
  isAdmin: boolean;
  onSelect: (deal: DealSelectorOption) => void;
};

export function DealSelectorDialog({
  open,
  onOpenChange,
  selectedDealId,
  isAdmin,
  onSelect,
}: DealSelectorDialogProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sector, setSector] = useState("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const marketplaceQuery = useQuery({
    ...trpc.deals.getMarketplaceDeals.queryOptions({
      page,
      limit: 12,
      search: deferredSearch || undefined,
      status: status === "all" ? undefined : status,
      sector: sector === "all" ? undefined : sector,
    }),
    enabled: open && !isAdmin,
  });

  const adminQuery = useQuery({
    ...trpc.admin.getDeals.queryOptions({
      page,
      limit: 12,
      search: deferredSearch || undefined,
      status: status === "all" ? undefined : status,
    }),
    enabled: open && isAdmin,
  });

  const isLoading = isAdmin ? adminQuery.isLoading : marketplaceQuery.isLoading;
  const isFetching = isAdmin
    ? adminQuery.isFetching
    : marketplaceQuery.isFetching;

  const deals: DealSelectorOption[] = isAdmin
    ? (adminQuery.data?.deals ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        sector: d.sector,
        teaserSummary: d.teaserSummary,
      }))
    : (marketplaceQuery.data?.deals ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        sector: d.sector,
        teaserSummary: d.teaserSummary,
      }));

  const pagination = isAdmin
    ? adminQuery.data?.pagination
    : marketplaceQuery.data?.pagination;

  const sectors =
    !isAdmin && marketplaceQuery.data && "filters" in marketplaceQuery.data
      ? ((marketplaceQuery.data.filters as { sectors?: string[] })?.sectors ??
        [])
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a deal</DialogTitle>
          <DialogDescription>
            Deal context scopes knowledge search and escalation for this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search deals…"
              value={search}
            />
          </div>
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              value={status}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="coming_soon">Coming soon</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
              </SelectContent>
            </Select>
            {!isAdmin && sectors.length > 0 ? (
              <Select
                onValueChange={(value) => {
                  setSector(value);
                  setPage(1);
                }}
                value={sector}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sectors</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Loading deals…
            </div>
          ) : deals.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No deals found.
            </div>
          ) : (
            deals.map((deal) => {
              const selected = deal.id === selectedDealId;
              return (
                <button
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/60",
                    selected && "border-primary bg-primary/5",
                  )}
                  key={deal.id}
                  onClick={() => onSelect(deal)}
                  type="button"
                >
                  <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{deal.name}</span>
                      {selected ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {deal.status ? <span>{deal.status}</span> : null}
                      {deal.sector ? <span>{deal.sector}</span> : null}
                    </div>
                    {deal.teaserSummary ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {deal.teaserSummary}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button
              disabled={!pagination.hasPrevPage || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              disabled={!pagination.hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Next
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

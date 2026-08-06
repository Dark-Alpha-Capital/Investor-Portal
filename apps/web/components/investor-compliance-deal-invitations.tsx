import { useCallback, useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "@/hooks/use-app-navigation";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  PARTICIPATION_LABELS,
  type ParticipationStatus,
} from "@/lib/participation";

type DealAccessLevel = "teaser" | "data_room";
type AccessSelection = "no_access" | DealAccessLevel;
type AccessFilter = "all" | AccessSelection;
type ParticipationFilter = "all" | ParticipationStatus;

const INVITATION_PAGE_SIZE = 25;

type Invitation = {
  id: string;
  dealId: string;
  dealName: string;
  accessLevel: DealAccessLevel;
  grantedAt: Date | string;
  grantedByName: string | null;
  participationStatus?: ParticipationStatus;
  dataRoomRequestedAt?: Date | string | null;
  dataRoomRequestMessage?: string | null;
};

type InvitationDealRow = {
  dealId: string;
  dealName: string;
  sector: string | null;
  dealType: string | null;
  geography: string | null;
  targetRaise: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  createdAt: string;
  accessLevel: DealAccessLevel | null;
  participation: ParticipationStatus;
  dataRoomRequestedAt: string | null;
  dataRoomRequestMessage: string | null;
};

type DealInvitationsProps = {
  investorId: string;
  invitations: Invitation[];
  isApproved: boolean;
};

const ACCESS_LABELS: Record<AccessSelection, string> = {
  no_access: "No Access",
  teaser: "Teaser",
  data_room: "Data Room",
};

const PARTICIPATION_FILTERS: ParticipationFilter[] = [
  "all",
  "no_response",
  "interested",
  "committed",
  "funded",
  "declined",
];

function participationBadgeVariant(
  status: ParticipationStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "funded":
    case "committed":
      return "default";
    case "interested":
      return "outline";
    case "declined":
      return "destructive";
    case "no_response":
      return "secondary";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

const formatCurrency = (value: string | null) => {
  if (value === null || value === undefined) return "-";
  const numValue = parseFloat(value);
  if (Number.isNaN(numValue)) return "-";
  if (numValue >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
  }
  if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(0)}K`;
  }
  return `$${numValue.toLocaleString()}`;
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function DealSearchField({
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
  }, 250);

  return (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={draft ? "pl-9 pr-9" : "pl-9"}
        placeholder="Search live deals..."
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

function PaginationBar({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const list: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      list.push(1);
      if (page > 3) list.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) list.push(i);
      if (page < totalPages - 2) list.push("...");
      list.push(totalPages);
    }
    return list;
  }, [page, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {pages.map((pageNum, idx) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              className="min-w-[36px]"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DealInvitations({
  investorId,
  invitations,
  isApproved,
}: DealInvitationsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dealSearch, setDealSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [participationFilter, setParticipationFilter] =
    useState<ParticipationFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [dealTypeFilter, setDealTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const pendingRequests = useMemo(
    () =>
      invitations.filter(
        (inv) => inv.accessLevel === "teaser" && !!inv.dataRoomRequestedAt,
      ),
    [invitations],
  );

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["compliance", "investor", investorId],
    });
    router.refresh();
  }, [investorId, queryClient, router]);

  const inviteMutation = useMutation(
    trpc.compliance.inviteToDeal.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation updated");
        invalidate();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update invitation");
      },
    }),
  );

  const withdrawMutation = useMutation(
    trpc.compliance.withdrawInvitation.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation withdrawn");
        invalidate();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to withdraw invitation");
      },
    }),
  );

  const handleAccessChange = useCallback(
    (dealId: string, value: AccessSelection) => {
      if (value === "no_access") {
        withdrawMutation.mutate({ userId: investorId, dealId });
        return;
      }
      inviteMutation.mutate({
        userId: investorId,
        dealId,
        accessLevel: value,
      });
    },
    [investorId, inviteMutation, withdrawMutation],
  );

  const handleGrantDataRoom = useCallback(
    (dealId: string) => {
      inviteMutation.mutate({
        userId: investorId,
        dealId,
        accessLevel: "data_room",
      });
    },
    [investorId, inviteMutation],
  );

  const isPending = inviteMutation.isPending || withdrawMutation.isPending;

  const resetPage = useCallback(() => setPage(1), []);

  const filterOptionsQuery = useQuery({
    ...trpc.compliance.listInvitationFilterOptions.queryOptions({
      investorId,
    }),
  });

  const rowsQuery = useQuery({
    ...trpc.compliance.listInvitationDeals.queryOptions({
      investorId,
      page,
      limit: INVITATION_PAGE_SIZE,
      search: dealSearch.trim() ? dealSearch.trim() : undefined,
      accessLevel: accessFilter === "all" ? undefined : accessFilter,
      participation:
        participationFilter === "all" ? undefined : participationFilter,
      sector: sectorFilter === "all" ? undefined : sectorFilter,
      dealType: dealTypeFilter === "all" ? undefined : dealTypeFilter,
    }),
    placeholderData: keepPreviousData,
  });

  const rows: InvitationDealRow[] = rowsQuery.data?.rows ?? [];
  const totalCount = rowsQuery.data?.pagination.totalCount ?? 0;
  const totalPages = rowsQuery.data?.pagination.totalPages ?? 1;
  const hasNextPage = rowsQuery.data?.pagination.hasNextPage ?? false;
  const hasPreviousPage = rowsQuery.data?.pagination.hasPrevPage ?? false;
  const isLoading = rowsQuery.isLoading;
  const isFetching = rowsQuery.isFetching;

  const filterOptions = filterOptionsQuery.data;
  const sectors = filterOptions?.sectors ?? [];
  const dealTypes = filterOptions?.dealTypes ?? [];

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Only live deals are listed here. Set access per deal — Teaser is
            read-only; Data Room unlocks documents, interest, and commitments.
          </p>
        </div>
        <DealSearchField
          value={dealSearch}
          onValueChange={(value) => {
            setDealSearch(value);
            resetPage();
          }}
        />
      </div>

      {!isApproved && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Investor must be Approved before they can be invited to deals.
        </p>
      )}

      {pendingRequests.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTitle>
            {pendingRequests.length} data room request
            {pendingRequests.length === 1 ? "" : "s"} pending
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              This investor asked to upgrade from Teaser to Data Room. Grant
              access below or change Access to Data Room.
            </p>
            <ul className="space-y-2">
              {pendingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-col gap-2 rounded-md border bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{req.dealName}</p>
                    {req.dataRoomRequestMessage ? (
                      <p className="text-sm text-muted-foreground">
                        “{req.dataRoomRequestMessage}”
                      </p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleGrantDataRoom(req.dealId)}
                  >
                    Grant Data Room
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Access
          </label>
          <Select
            value={accessFilter}
            onValueChange={(value) => {
              setAccessFilter(value as AccessFilter);
              resetPage();
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Access</SelectItem>
              <SelectItem value="no_access">No Access</SelectItem>
              <SelectItem value="teaser">Teaser</SelectItem>
              <SelectItem value="data_room">Data Room</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Participation
          </label>
          <Select
            value={participationFilter}
            onValueChange={(value) => {
              setParticipationFilter(value as ParticipationFilter);
              resetPage();
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Participation</SelectItem>
              {PARTICIPATION_FILTERS.filter((p) => p !== "all").map((p) => (
                <SelectItem key={p} value={p}>
                  {PARTICIPATION_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sectors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Sector
            </label>
            <Select
              value={sectorFilter}
              onValueChange={(value) => {
                setSectorFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {dealTypes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Deal Type
            </label>
            <Select
              value={dealTypeFilter}
              onValueChange={(value) => {
                setDealTypeFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {dealTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(accessFilter !== "all" ||
          participationFilter !== "all" ||
          sectorFilter !== "all" ||
          dealTypeFilter !== "all" ||
          dealSearch.trim()) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAccessFilter("all");
              setParticipationFilter("all");
              setSectorFilter("all");
              setDealTypeFilter("all");
              setDealSearch("");
              resetPage();
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}

        {isFetching ? (
          <Loader2 className="mb-1.5 h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">
                Target Raise
              </TableHead>
              <TableHead className="hidden lg:table-cell">Target IRR</TableHead>
              <TableHead className="hidden xl:table-cell">Target MOIC</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Participation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  {dealSearch.trim() ||
                  accessFilter !== "all" ||
                  participationFilter !== "all" ||
                  sectorFilter !== "all" ||
                  dealTypeFilter !== "all"
                    ? "No live deals match your filters."
                    : "No live deals available to invite to."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.dealId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{row.dealName}</span>
                      <span className="text-xs text-muted-foreground">
                        {[row.sector, row.dealType, row.geography]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                      {row.dataRoomRequestedAt &&
                      row.accessLevel === "teaser" ? (
                        <Badge variant="outline" className="w-fit text-xs">
                          Data room requested
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {formatCurrency(row.targetRaise)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {row.targetIrr ? `${row.targetIrr}%` : "-"}
                  </TableCell>
                  <TableCell className="hidden tabular-nums xl:table-cell">
                    {row.targetMoic ? `${row.targetMoic}x` : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.accessLevel ?? "no_access"}
                      disabled={!isApproved || isPending}
                      onValueChange={(v) =>
                        handleAccessChange(row.dealId, v as AccessSelection)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_access">
                          {ACCESS_LABELS.no_access}
                        </SelectItem>
                        <SelectItem value="teaser">
                          {ACCESS_LABELS.teaser}
                        </SelectItem>
                        <SelectItem value="data_room">
                          {ACCESS_LABELS.data_room}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {!row.accessLevel ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant={participationBadgeVariant(row.participation)}
                      >
                        {PARTICIPATION_LABELS[row.participation]}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalCount > 0 ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {totalCount} live deal{totalCount === 1 ? "" : "s"}
          </p>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}

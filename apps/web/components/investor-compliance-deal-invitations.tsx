import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import { Search, X } from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deriveParticipationStatus,
  PARTICIPATION_LABELS,
  type ParticipationStatus,
} from "@/lib/participation";

type DealAccessLevel = "teaser" | "data_room";
type AccessSelection = "no_access" | DealAccessLevel;

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

type AvailableDeal = {
  id: string;
  name: string;
  status: string;
};

type DealInvitationsProps = {
  investorId: string;
  invitations: Invitation[];
  availableDeals: AvailableDeal[];
  isApproved: boolean;
};

const ACCESS_LABELS: Record<AccessSelection, string> = {
  no_access: "No Access",
  teaser: "Teaser",
  data_room: "Data Room",
};

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

export function DealInvitations({
  investorId,
  invitations,
  availableDeals,
  isApproved,
}: DealInvitationsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dealSearch, setDealSearch] = useState("");

  const invitationByDeal = useMemo(() => {
    const map = new Map<string, Invitation>();
    for (const inv of invitations) {
      map.set(inv.dealId, inv);
    }
    return map;
  }, [invitations]);

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

  const rows = useMemo(() => {
    const tokens = dealSearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const deals = tokens.length
      ? availableDeals.filter((deal) =>
          tokens.every((token) =>
            deal.name.toLowerCase().includes(token),
          ),
        )
      : availableDeals;

    return deals.map((deal) => {
      const inv = invitationByDeal.get(deal.id);
      const participation =
        inv?.participationStatus ?? deriveParticipationStatus(null, null);
      return {
        dealId: deal.id,
        dealName: deal.name,
        access: (inv ? inv.accessLevel : "no_access") as AccessSelection,
        participation,
        dataRoomRequestedAt: inv?.dataRoomRequestedAt ?? null,
        dataRoomRequestMessage: inv?.dataRoomRequestMessage ?? null,
      };
    });
  }, [availableDeals, dealSearch, invitationByDeal]);

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
        <DealSearchField value={dealSearch} onValueChange={setDealSearch} />
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Participation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                {dealSearch.trim()
                  ? "No live deals match your search."
                  : "No live deals available to invite to."}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.dealId}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{row.dealName}</span>
                    {row.dataRoomRequestedAt && row.access === "teaser" ? (
                      <Badge variant="outline" className="w-fit text-xs">
                        Data room requested
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.access}
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
                  {row.access === "no_access" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge variant={participationBadgeVariant(row.participation)}>
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
  );
}

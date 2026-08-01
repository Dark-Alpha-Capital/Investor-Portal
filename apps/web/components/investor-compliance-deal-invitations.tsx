import { useState, useCallback, useMemo } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  status: ParticipationStatus
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

export function DealInvitations({
  investorId,
  invitations,
  availableDeals,
  isApproved,
}: DealInvitationsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [inviteLevel, setInviteLevel] = useState<DealAccessLevel>("teaser");

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
        (inv) =>
          inv.accessLevel === "teaser" &&
          !!inv.dataRoomRequestedAt
      ),
    [invitations]
  );

  const dealsWithoutInvite = useMemo(
    () => availableDeals.filter((d) => !invitationByDeal.has(d.id)),
    [availableDeals, invitationByDeal]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries();
    router.refresh();
  }, [queryClient, router]);

  const inviteMutation = useMutation(
    trpc.compliance.inviteToDeal.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation updated");
        setDialogOpen(false);
        setSelectedDealId("");
        setInviteLevel("teaser");
        invalidate();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update invitation");
      },
    })
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
    })
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
    [investorId, inviteMutation, withdrawMutation]
  );

  const handleGrantDataRoom = useCallback(
    (dealId: string) => {
      inviteMutation.mutate({
        userId: investorId,
        dealId,
        accessLevel: "data_room",
      });
    },
    [investorId, inviteMutation]
  );

  const handleInvite = useCallback(() => {
    if (!selectedDealId) {
      toast.error("Select a deal");
      return;
    }
    inviteMutation.mutate({
      userId: investorId,
      dealId: selectedDealId,
      accessLevel: inviteLevel,
    });
  }, [selectedDealId, inviteLevel, investorId, inviteMutation]);

  const isPending = inviteMutation.isPending || withdrawMutation.isPending;

  const rows = useMemo(() => {
    return availableDeals.map((deal) => {
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
  }, [availableDeals, invitationByDeal]);

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Invite this investor to deals. Access level controls what they can
            see and do.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isApproved || dealsWithoutInvite.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Invite to deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to deal</DialogTitle>
              <DialogDescription>
                Choose a deal and access level. Teaser is read-only; Data Room
                unlocks documents, interest, and commitments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Deal</Label>
                <Select
                  value={selectedDealId}
                  onValueChange={setSelectedDealId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealsWithoutInvite.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Access</Label>
                <Select
                  value={inviteLevel}
                  onValueChange={(v) => setInviteLevel(v as DealAccessLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teaser">Teaser</SelectItem>
                    <SelectItem value="data_room">Data Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isPending || !selectedDealId}
              >
                {inviteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                No active deals available.
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
                    <SelectTrigger className="w-[160px]">
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  ticketId: string;
  currentStatus: string;
  currentAssignee: string | null;
  adminUsers: AdminUser[];
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_user", label: "Pending User Response" },
];

export function TicketActions({
  ticketId,
  currentStatus,
  currentAssignee,
  adminUsers,
}: Props) {
  const router = useRouter();
  const trpc = useTRPC();

  const [assignee, setAssignee] = useState(currentAssignee || "");
  const [status, setStatus] = useState(currentStatus);
  const [resolution, setResolution] = useState("");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  // Mutations
  const assignTicket = useMutation(
    trpc.tickets.assignTicket.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );

  const updateStatus = useMutation(
    trpc.tickets.updateStatus.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );

  const resolveTicket = useMutation(
    trpc.tickets.resolveTicket.mutationOptions({
      onSuccess: () => {
        setResolveDialogOpen(false);
        router.refresh();
      },
    })
  );

  const closeTicket = useMutation(
    trpc.tickets.closeTicket.mutationOptions({
      onSuccess: () => {
        setCloseDialogOpen(false);
        router.refresh();
      },
    })
  );

  const handleAssign = () => {
    if (!assignee) return;
    assignTicket.mutate({ ticketId, assignedTo: assignee });
  };

  const handleStatusChange = () => {
    if (status === currentStatus) return;
    updateStatus.mutate({ ticketId, status: status as any });
  };

  const handleResolve = () => {
    if (!resolution.trim()) return;
    resolveTicket.mutate({ ticketId, resolution: resolution.trim() });
  };

  const handleClose = () => {
    closeTicket.mutate({ ticketId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assign */}
        <div className="space-y-2">
          <Label>Assign To</Label>
          <div className="flex gap-2">
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {adminUsers.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name || admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              onClick={handleAssign}
              disabled={!assignee || assignee === currentAssignee || assignTicket.isPending}
            >
              {assignTicket.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Update Status</Label>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              onClick={handleStatusChange}
              disabled={status === currentStatus || updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Resolve */}
        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="default">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolve Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Ticket</DialogTitle>
              <DialogDescription>
                Provide a resolution summary for the investor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Describe how the issue was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!resolution.trim() || resolveTicket.isPending}
              >
                {resolveTicket.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Resolve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close */}
        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <XCircle className="h-4 w-4 mr-2" />
              Close Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Ticket</DialogTitle>
              <DialogDescription>
                Are you sure you want to close this ticket? Closed tickets cannot receive
                new comments.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={closeTicket.isPending}
              >
                {closeTicket.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Close Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

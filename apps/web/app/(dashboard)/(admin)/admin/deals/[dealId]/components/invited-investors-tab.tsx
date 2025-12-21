"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type DealInvite = {
  id: string;
  userId: string;
  curationNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    kycStatus: string;
    isOnboardingCompleted: boolean;
  };
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

type InvitedInvestorsTabProps = {
  dealId: string;
  invites: DealInvite[];
};

export function InvitedInvestorsTab({
  dealId,
  invites,
}: InvitedInvestorsTabProps) {
  const router = useRouter();
  const trpc = useTRPC();

  const { mutateAsync: removeInvites, isPending: isRemoving } = useMutation(
    trpc.deals.removeInvites.mutationOptions({
      onSuccess: () => {
        toast.success("Investor removed successfully");
        router.refresh();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to remove investor");
      },
    })
  );

  const handleRemove = async (userId: string) => {
    try {
      await removeInvites({
        dealId,
        userIds: [userId],
      });
    } catch (error) {
      // Error handled by mutation options
    }
  };

  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No investors have been invited to this deal yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Investor</TableHead>
            <TableHead className="font-medium">Email</TableHead>
            <TableHead className="font-medium">KYC Status</TableHead>
            <TableHead className="font-medium">Onboarding</TableHead>
            <TableHead className="font-medium">Invited</TableHead>
            <TableHead className="font-medium w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow
              key={invite.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invite.user.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {invite.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/admin/users/${invite.user.id}`}
                    className="font-medium hover:underline"
                  >
                    {invite.user.name}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invite.user.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-xs font-normal capitalize"
                >
                  {invite.user.kycStatus.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {invite.user.isOnboardingCompleted ? (
                  <Badge variant="default" className="text-xs">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(invite.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(invite.userId)}
                  disabled={isRemoving}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, Save, Users, CheckSquare, Square, X } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

type Investor = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  kycStatus: string;
  isOnboardingCompleted: boolean;
};

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

type DealCurationTabsProps = {
  dealId: string;
  investors: Investor[];
  invites: DealInvite[];
};

// Hoist utility function outside component to avoid recreation
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Memoized sub-components for better performance
const InvestorRow = memo(function InvestorRow({
  investor,
  isSelected,
  onToggle,
}: {
  investor: Investor;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(investor.id);
    },
    [investor.id, onToggle]
  );

  const handleCheckboxChange = useCallback(() => {
    onToggle(investor.id);
  }, [investor.id, onToggle]);

  return (
    <TableRow
      className="hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onToggle(investor.id)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={handleClick}
        />
      </TableCell>
      <TableCell className="font-medium">{investor.name}</TableCell>
      <TableCell className="text-muted-foreground">{investor.email}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs font-normal capitalize">
          {investor.kycStatus.replace(/_/g, " ")}
        </Badge>
      </TableCell>
      <TableCell>
        {investor.isOnboardingCompleted ? (
          <Badge variant="default" className="text-xs">
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
});
InvestorRow.displayName = "InvestorRow";

const InvitedInvestorRow = memo(function InvitedInvestorRow({
  invite,
  onRemove,
  isRemoving,
}: {
  invite: DealInvite;
  onRemove: (userId: string) => void;
  isRemoving: boolean;
}) {
  const handleRemove = useCallback(() => {
    onRemove(invite.userId);
  }, [invite.userId, onRemove]);

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={invite.user.image || undefined} />
            <AvatarFallback className="text-xs">
              {invite.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/admin/compliance/investors/${invite.user.id}`}
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
        <Badge variant="outline" className="text-xs font-normal capitalize">
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
          onClick={handleRemove}
          disabled={isRemoving}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});
InvitedInvestorRow.displayName = "InvitedInvestorRow";

const SelectedInvestorItem = memo(function SelectedInvestorItem({
  investor,
}: {
  investor: Investor;
}) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={investor.image || undefined} />
        <AvatarFallback className="text-xs">
          {investor.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{investor.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {investor.email}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-normal capitalize">
          {investor.kycStatus.replace(/_/g, " ")}
        </Badge>
        {investor.isOnboardingCompleted ? (
          <Badge variant="default" className="text-xs">
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        )}
      </div>
    </div>
  );
});
SelectedInvestorItem.displayName = "SelectedInvestorItem";

export function DealCurationTabs({
  dealId,
  investors,
  invites,
}: DealCurationTabsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [selectedInvestors, setSelectedInvestors] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoize search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const invitedUserIds = useMemo(() => {
    return new Set(invites.map((invite) => invite.userId));
  }, [invites]);

  // Filter out already invited investors
  const uninvitedInvestors = useMemo(() => {
    return investors.filter((investor) => !invitedUserIds.has(investor.id));
  }, [investors, invitedUserIds]);

  const filteredInvestors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return uninvitedInvestors.filter(
      (investor) =>
        investor.name.toLowerCase().includes(query) ||
        investor.email.toLowerCase().includes(query)
    );
  }, [uninvitedInvestors, searchQuery]);

  const { mutateAsync: addInvites, isPending: isAdding } = useMutation(
    trpc.deals.addInvites.mutationOptions({
      onSuccess: () => {
        toast.success("Investors invited successfully");
        router.refresh();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to invite investors");
      },
    })
  );

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

  // Use functional setState updates and useCallback for stable references
  const handleToggleInvestor = useCallback((investorId: string) => {
    setSelectedInvestors((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(investorId)) {
        newSelected.delete(investorId);
      } else {
        newSelected.add(investorId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedInvestors(() => {
      return new Set(filteredInvestors.map((investor) => investor.id));
    });
  }, [filteredInvestors]);

  const handleDeselectAll = useCallback(() => {
    setSelectedInvestors(new Set());
  }, []);

  const allSelected = useMemo(
    () =>
      filteredInvestors.length > 0 &&
      filteredInvestors.every((investor) => selectedInvestors.has(investor.id)),
    [filteredInvestors, selectedInvestors]
  );

  const handleInviteClick = useCallback(() => {
    if (selectedInvestors.size === 0) {
      toast.error("Please select at least one investor");
      return;
    }
    setIsDialogOpen(true);
  }, [selectedInvestors.size]);

  const handleInviteConfirm = useCallback(async () => {
    try {
      const userIds = Array.from(selectedInvestors);
      await addInvites({
        dealId,
        userIds,
      });
      setSelectedInvestors(new Set());
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by mutation options
    }
  }, [selectedInvestors, dealId, addInvites]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  const handleSelectAllCheckbox = useCallback(
    (checked: boolean) => {
      if (checked) {
        handleSelectAll();
      } else {
        handleDeselectAll();
      }
    },
    [handleSelectAll, handleDeselectAll]
  );

  const handleRemove = useCallback(
    async (userId: string) => {
      try {
        await removeInvites({
          dealId,
          userIds: [userId],
        });
      } catch (error) {
        // Error handled by mutation options
      }
    },
    [dealId, removeInvites]
  );

  // Get selected investor details for display in dialog
  const selectedInvestorDetails = useMemo(() => {
    return investors.filter((investor) => selectedInvestors.has(investor.id));
  }, [investors, selectedInvestors]);

  // Memoize tab counts to avoid recalculation
  const uninvitedCount = useMemo(
    () => investors.length - invitedUserIds.size,
    [investors.length, invitedUserIds.size]
  );

  return (
    <Tabs defaultValue="uninvited" className="w-full">
      <TabsList>
        <TabsTrigger value="uninvited">
          Uninvited ({uninvitedCount})
        </TabsTrigger>
        <TabsTrigger value="invited">Invited ({invites.length})</TabsTrigger>
      </TabsList>

      {/* Uninvited Investors Tab */}
      <TabsContent value="uninvited" className="mt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {selectedInvestors.size} selected
              </Badge>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                disabled={allSelected || filteredInvestors.length === 0}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Select All
              </Button>
              <Button
                onClick={handleDeselectAll}
                variant="outline"
                size="sm"
                disabled={selectedInvestors.size === 0}
              >
                <Square className="mr-2 h-4 w-4" />
                Deselect All
              </Button>
              <Button
                onClick={handleInviteClick}
                disabled={selectedInvestors.size === 0 || isAdding}
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                Invite Selected ({selectedInvestors.size})
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search investors by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAllCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">KYC Status</TableHead>
                  <TableHead className="font-medium">Onboarding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        {uninvitedInvestors.length === 0
                          ? "All investors have been invited"
                          : "No investors found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvestors.map((investor) => (
                    <InvestorRow
                      key={investor.id}
                      investor={investor}
                      isSelected={selectedInvestors.has(investor.id)}
                      onToggle={handleToggleInvestor}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Confirmation Dialog */}
          <AlertDialog
            open={isDialogOpen}
            onOpenChange={handleDialogOpenChange}
          >
            <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Confirm Investor Invitation
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to invite {selectedInvestors.size} investor
                  {selectedInvestors.size > 1 ? "s" : ""} to this deal. Please
                  review the list below and confirm to proceed.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Scrollable list of selected investors */}
              <div className="flex-1 overflow-y-auto border rounded-lg mt-4">
                <div className="divide-y">
                  {selectedInvestorDetails.map((investor) => (
                    <SelectedInvestorItem
                      key={investor.id}
                      investor={investor}
                    />
                  ))}
                </div>
              </div>

              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel disabled={isAdding}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleInviteConfirm}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Confirm & Invite {selectedInvestors.size} Investor
                      {selectedInvestors.size > 1 ? "s" : ""}
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TabsContent>

      {/* Invited Investors Tab */}
      <TabsContent value="invited" className="mt-6">
        {invites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No investors have been invited to this deal yet.
            </p>
          </div>
        ) : (
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
                  <InvitedInvestorRow
                    key={invite.id}
                    invite={invite}
                    onRemove={handleRemove}
                    isRemoving={isRemoving}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

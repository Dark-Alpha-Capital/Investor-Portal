"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Save, Users, CheckSquare, Square } from "lucide-react";
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

type UninvitedInvestorsTabProps = {
  dealId: string;
  investors: Investor[];
  invitedUserIds: Set<string>;
};

export function UninvitedInvestorsTab({
  dealId,
  investors,
  invitedUserIds,
}: UninvitedInvestorsTabProps) {
  const router = useRouter();
  const [selectedInvestors, setSelectedInvestors] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const trpc = useTRPC();

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

  const handleToggleInvestor = (
    investorId: string,
    event?: React.MouseEvent
  ) => {
    // Prevent event propagation if called from checkbox click
    if (event) {
      event.stopPropagation();
    }
    const newSelected = new Set(selectedInvestors);
    if (newSelected.has(investorId)) {
      newSelected.delete(investorId);
    } else {
      newSelected.add(investorId);
    }
    setSelectedInvestors(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredInvestors.map((investor) => investor.id));
    setSelectedInvestors(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedInvestors(new Set());
  };

  const allSelected =
    filteredInvestors.length > 0 &&
    filteredInvestors.every((investor) => selectedInvestors.has(investor.id));

  const handleInviteClick = () => {
    if (selectedInvestors.size === 0) {
      toast.error("Please select at least one investor");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleInviteConfirm = async () => {
    try {
      await addInvites({
        dealId,
        userIds: Array.from(selectedInvestors),
      });
      setSelectedInvestors(new Set());
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by mutation options
    }
  };

  // Get selected investor details for display in dialog
  const selectedInvestorDetails = useMemo(() => {
    return investors.filter((investor) => selectedInvestors.has(investor.id));
  }, [investors, selectedInvestors]);

  return (
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
          onChange={(e) => setSearchQuery(e.target.value)}
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
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleDeselectAll();
                    }
                  }}
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
                <TableRow
                  key={investor.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleInvestor(investor.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedInvestors.has(investor.id)}
                      onCheckedChange={() => handleToggleInvestor(investor.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{investor.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {investor.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal capitalize"
                    >
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <div
                  key={investor.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={investor.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {investor.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {investor.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {investor.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal capitalize"
                    >
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
              ))}
            </div>
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isAdding}>Cancel</AlertDialogCancel>
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
  );
}

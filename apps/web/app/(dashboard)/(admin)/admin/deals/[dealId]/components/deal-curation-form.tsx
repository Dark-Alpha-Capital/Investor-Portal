"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  };
};

type DealCurationFormProps = {
  dealId: string;
  investors: Investor[];
  invites: DealInvite[];
};

export function DealCurationForm({
  dealId,
  investors,
  invites,
}: DealCurationFormProps) {
  const router = useRouter();
  const [selectedInvestors, setSelectedInvestors] = useState<Set<string>>(
    new Set(invites.map((invite) => invite.userId))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const trpc = useTRPC();

  const { mutateAsync: addInvites, isPending: isAdding } = useMutation(
    trpc.deals.addInvites.mutationOptions()
  );

  const { mutateAsync: removeInvites, isPending: isRemoving } = useMutation(
    trpc.deals.removeInvites.mutationOptions()
  );

  const handleToggleInvestor = (investorId: string) => {
    const newSelected = new Set(selectedInvestors);
    if (newSelected.has(investorId)) {
      newSelected.delete(investorId);
    } else {
      newSelected.add(investorId);
    }
    setSelectedInvestors(newSelected);
  };

  const handleSave = async () => {
    try {
      // Get current invite user IDs
      const currentInviteUserIds = new Set(
        invites.map((invite) => invite.userId)
      );

      // Find investors to add (selected but not in current invites)
      const toAdd = Array.from(selectedInvestors).filter(
        (id) => !currentInviteUserIds.has(id)
      );

      // Find investors to remove (in current invites but not selected)
      const toRemove = Array.from(currentInviteUserIds).filter(
        (id) => !selectedInvestors.has(id)
      );

      // Add new invites
      if (toAdd.length > 0) {
        await addInvites({
          dealId,
          userIds: toAdd,
        });
      }

      // Remove invites
      if (toRemove.length > 0) {
        await removeInvites({
          dealId,
          userIds: toRemove,
        });
      }

      toast.success("Deal curation updated successfully");
      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error("Error saving curation:", error);
      toast.error(error.message || "Failed to save curation");
    }
  };

  const filteredInvestors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return investors.filter(
      (investor) =>
        investor.name.toLowerCase().includes(query) ||
        investor.email.toLowerCase().includes(query)
    );
  }, [investors, searchQuery]);

  const isSaving = isAdding || isRemoving;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedInvestors.size} selected
          </Badge>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
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
              <TableHead className="w-12"></TableHead>
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
                    No investors found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvestors.map((investor) => (
                <TableRow
                  key={investor.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedInvestors.has(investor.id)}
                      onCheckedChange={() => handleToggleInvestor(investor.id)}
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
    </div>
  );
}

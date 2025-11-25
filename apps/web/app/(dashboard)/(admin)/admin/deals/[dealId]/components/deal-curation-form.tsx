"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, X, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  user: Investor;
};

type DealCurationFormProps = {
  dealId: string;
};

export function DealCurationForm({ dealId }: DealCurationFormProps) {
  const router = useRouter();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [invites, setInvites] = useState<DealInvite[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dealId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all investors
      const investorsResponse = await fetch("/api/investors");
      const investorsData = await investorsResponse.json();

      // Fetch existing invites
      const invitesResponse = await fetch(`/api/deals/${dealId}/invites`);
      const invitesData = await invitesResponse.json();

      if (investorsData.success) {
        setInvestors(investorsData.investors);
      }

      if (invitesData.success) {
        setInvites(invitesData.invites);
        // Pre-select investors who already have invites
        const invitedUserIds = new Set(
          invitesData.invites.map((invite: DealInvite) => invite.userId)
        );
        setSelectedInvestors(invitedUserIds);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsSaving(true);
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
        const addResponse = await fetch(`/api/deals/${dealId}/invites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: toAdd }),
        });

        const addData = await addResponse.json();
        if (!addData.success) {
          throw new Error(addData.message || "Failed to add invites");
        }
      }

      // Remove invites
      if (toRemove.length > 0) {
        const removeResponse = await fetch(`/api/deals/${dealId}/invites`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: toRemove }),
        });

        const removeData = await removeResponse.json();
        if (!removeData.success) {
          throw new Error(removeData.message || "Failed to remove invites");
        }
      }

      toast.success("Deal curation updated successfully");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error saving curation:", error);
      toast.error(error.message || "Failed to save curation");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInvestors = investors.filter((investor) => {
    const query = searchQuery.toLowerCase();
    return (
      investor.name.toLowerCase().includes(query) ||
      investor.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading investors...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Investors</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which investors can see this deal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedInvestors.size} selected
              </Badge>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search investors by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Onboarding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No investors found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvestors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvestors.has(investor.id)}
                          onCheckedChange={() =>
                            handleToggleInvestor(investor.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {investor.name}
                      </TableCell>
                      <TableCell>{investor.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {investor.kycStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {investor.isOnboardingCompleted ? (
                          <Badge variant="default">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


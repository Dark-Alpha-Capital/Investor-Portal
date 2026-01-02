"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Building2,
  Eye,
  FileText,
  HandCoins,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type VehiclePermission = {
  id: string;
  dealId: string;
  dealName: string;
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  grantedAt: Date;
  grantedByName: string | null;
};

type AvailableDeal = {
  id: string;
  name: string;
  status: string;
};

type VehiclePermissionsProps = {
  investorId: string;
  permissions: VehiclePermission[];
};

export function VehiclePermissions({ investorId, permissions: initialPermissions }: VehiclePermissionsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [newPermissions, setNewPermissions] = useState({
    canViewTeaser: true,
    canViewDocuments: false,
    canExpressInterest: false,
    canInvest: false,
  });

  // Fetch available deals
  const { data: availableDeals = [], isLoading: isLoadingDeals } = useQuery(
    trpc.compliance.getAvailableDeals.queryOptions()
  );

  // Filter out deals that already have permissions
  const existingDealIds = new Set(initialPermissions.map((p) => p.dealId));
  const unassignedDeals = availableDeals.filter((d: AvailableDeal) => !existingDealIds.has(d.id));

  const grantPermissionMutation = useMutation(
    trpc.compliance.grantVehicleAccess.mutationOptions({
      onSuccess: () => {
        toast.success("Vehicle access granted successfully");
        queryClient.invalidateQueries({ queryKey: [["compliance"]] });
        setIsAddDialogOpen(false);
        setSelectedDeal("");
        setNewPermissions({
          canViewTeaser: true,
          canViewDocuments: false,
          canExpressInterest: false,
          canInvest: false,
        });
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to grant vehicle access");
      },
    })
  );

  const revokePermissionMutation = useMutation(
    trpc.compliance.revokeVehicleAccess.mutationOptions({
      onSuccess: () => {
        toast.success("Vehicle access revoked");
        queryClient.invalidateQueries({ queryKey: [["compliance"]] });
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to revoke vehicle access");
      },
    })
  );

  const handleGrantPermission = () => {
    if (!selectedDeal) {
      toast.error("Please select a deal");
      return;
    }
    grantPermissionMutation.mutate({
      userId: investorId,
      dealId: selectedDeal,
      permissions: newPermissions,
    });
  };

  const handleRevokePermission = (dealId: string) => {
    revokePermissionMutation.mutate({
      userId: investorId,
      dealId,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vehicle Permissions</CardTitle>
            <CardDescription>
              Manage which deals and vehicles this investor can access
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={unassignedDeals.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Vehicle Access</DialogTitle>
                <DialogDescription>
                  Select a deal and configure permissions for this investor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deal">Select Deal</Label>
                  <Select value={selectedDeal} onValueChange={setSelectedDeal}>
                    <SelectTrigger id="deal">
                      <SelectValue placeholder="Choose a deal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingDeals ? (
                        <SelectItem value="loading" disabled>
                          Loading deals...
                        </SelectItem>
                      ) : (
                        unassignedDeals.map((deal: AvailableDeal) => (
                          <SelectItem key={deal.id} value={deal.id}>
                            {deal.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="view-teaser"
                        checked={newPermissions.canViewTeaser}
                        onCheckedChange={(checked) =>
                          setNewPermissions({ ...newPermissions, canViewTeaser: !!checked })
                        }
                      />
                      <Label htmlFor="view-teaser" className="text-sm font-normal cursor-pointer">
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          View Teaser
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="view-documents"
                        checked={newPermissions.canViewDocuments}
                        onCheckedChange={(checked) =>
                          setNewPermissions({ ...newPermissions, canViewDocuments: !!checked })
                        }
                      />
                      <Label htmlFor="view-documents" className="text-sm font-normal cursor-pointer">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          View Documents
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="express-interest"
                        checked={newPermissions.canExpressInterest}
                        onCheckedChange={(checked) =>
                          setNewPermissions({ ...newPermissions, canExpressInterest: !!checked })
                        }
                      />
                      <Label htmlFor="express-interest" className="text-sm font-normal cursor-pointer">
                        <span className="flex items-center gap-2">
                          <HandCoins className="h-4 w-4 text-muted-foreground" />
                          Express Interest
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="can-invest"
                        checked={newPermissions.canInvest}
                        onCheckedChange={(checked) =>
                          setNewPermissions({ ...newPermissions, canInvest: !!checked })
                        }
                      />
                      <Label htmlFor="can-invest" className="text-sm font-normal cursor-pointer">
                        <span className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          Can Invest
                        </span>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGrantPermission}
                  disabled={!selectedDeal || grantPermissionMutation.isPending}
                >
                  {grantPermissionMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Grant Access
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {initialPermissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No vehicle permissions granted yet</p>
            <p className="text-sm">Grant access to deals using the button above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialPermissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{permission.dealName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {permission.canViewTeaser && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Eye className="h-3 w-3" /> Teaser
                      </Badge>
                    )}
                    {permission.canViewDocuments && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" /> Documents
                      </Badge>
                    )}
                    {permission.canExpressInterest && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <HandCoins className="h-3 w-3" /> Interest
                      </Badge>
                    )}
                    {permission.canInvest && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Wallet className="h-3 w-3" /> Invest
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Granted {formatDate(permission.grantedAt)}
                    {permission.grantedByName && ` by ${permission.grantedByName}`}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to revoke access to &quot;{permission.dealName}&quot;? This action will be logged in the audit trail.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRevokePermission(permission.dealId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {revokePermissionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Revoke Access"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import { useState, useCallback, useMemo, useEffect } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  availableDeals: AvailableDeal[];
};

type PermissionType =
  | "canViewTeaser"
  | "canViewDocuments"
  | "canExpressInterest"
  | "canInvest";

const PERMISSION_CONFIG: Record<
  PermissionType,
  {
    label: string;
    icon: React.ElementType;
    badgeVariant: "default" | "outline";
  }
> = {
  canViewTeaser: {
    label: "Teaser",
    icon: Eye,
    badgeVariant: "outline",
  },
  canViewDocuments: {
    label: "Documents",
    icon: FileText,
    badgeVariant: "outline",
  },
  canExpressInterest: {
    label: "Interest",
    icon: HandCoins,
    badgeVariant: "outline",
  },
  canInvest: {
    label: "Invest",
    icon: Wallet,
    badgeVariant: "default",
  },
};

const DEFAULT_PERMISSIONS = {
  canViewTeaser: true,
  canViewDocuments: false,
  canExpressInterest: false,
  canInvest: false,
} as const;

export function VehiclePermissions({
  investorId,
  permissions: initialPermissions,
  availableDeals,
}: VehiclePermissionsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [newPermissions, setNewPermissions] = useState(DEFAULT_PERMISSIONS);

  // Memoized computed values
  const existingDealIds = useMemo(
    () => new Set(initialPermissions.map((p) => p.dealId)),
    [initialPermissions],
  );

  const unassignedDeals = useMemo(
    () =>
      availableDeals.filter((d: AvailableDeal) => !existingDealIds.has(d.id)),
    [availableDeals, existingDealIds],
  );

  const hasUnassignedDeals = useMemo(
    () => unassignedDeals.length > 0,
    [unassignedDeals],
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedDeal("");
      setNewPermissions(DEFAULT_PERMISSIONS);
    }
  }, [isAddDialogOpen]);

  const grantPermissionMutation = useMutation(
    trpc.compliance.grantVehicleAccess.mutationOptions({
      onSuccess: () => {
        toast.success("Vehicle access granted successfully");
        queryClient.invalidateQueries({ queryKey: [["compliance"]] });
        setIsAddDialogOpen(false);
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to grant vehicle access");
      },
    }),
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
    }),
  );

  const handleGrantPermission = useCallback(() => {
    // Validation
    if (!selectedDeal) {
      toast.error("Please select a deal");
      return;
    }

    // Ensure at least one permission is granted
    const hasAnyPermission = Object.values(newPermissions).some(
      (value) => value === true,
    );
    if (!hasAnyPermission) {
      toast.error("Please select at least one permission");
      return;
    }

    grantPermissionMutation.mutate({
      userId: investorId,
      dealId: selectedDeal,
      permissions: newPermissions,
    });
  }, [selectedDeal, newPermissions, investorId, grantPermissionMutation]);

  const handleRevokePermission = useCallback(
    (dealId: string, dealName: string) => {
      revokePermissionMutation.mutate({
        userId: investorId,
        dealId,
      });
    },
    [investorId, revokePermissionMutation],
  );

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const handlePermissionToggle = useCallback((permission: PermissionType) => {
    setNewPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  }, []);

  const handleDealSelect = useCallback((dealId: string) => {
    setSelectedDeal(dealId);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsAddDialogOpen(open);
  }, []);

  const getActivePermissions = useCallback((permission: VehiclePermission) => {
    return Object.entries(PERMISSION_CONFIG)
      .filter(([key]) => permission[key as PermissionType])
      .map(([key, config]) => ({
        key: key as PermissionType,
        ...config,
      }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vehicle Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage which deals and vehicles this investor can access
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              disabled={!hasUnassignedDeals}
              aria-label="Grant vehicle access"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
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
                <Select value={selectedDeal} onValueChange={handleDealSelect}>
                  <SelectTrigger id="deal" aria-label="Select deal">
                    <SelectValue placeholder="Choose a deal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedDeals.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No available deals
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
                <div
                  className="space-y-2"
                  role="group"
                  aria-label="Permission options"
                >
                  {Object.entries(PERMISSION_CONFIG).map(([key, config]) => {
                    const permissionKey = key as PermissionType;
                    const IconComponent = config.icon;
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={newPermissions[permissionKey]}
                          onCheckedChange={() =>
                            handlePermissionToggle(permissionKey)
                          }
                          aria-label={`Grant ${config.label} permission`}
                        />
                        <Label
                          htmlFor={key}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2"
                        >
                          <IconComponent
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {config.label === "Teaser"
                            ? "View Teaser"
                            : config.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={grantPermissionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGrantPermission}
                disabled={!selectedDeal || grantPermissionMutation.isPending}
                aria-label="Grant access with selected permissions"
              >
                {grantPermissionMutation.isPending && (
                  <Loader2
                    className="h-4 w-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Grant Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permissions Table */}
      {initialPermissions.length === 0 ? (
        <div className="rounded-md border border-dashed py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Building2
              className="h-12 w-12 mb-3 text-muted-foreground opacity-50"
              aria-hidden="true"
            />
            <p className="text-muted-foreground font-medium">
              No vehicle permissions granted yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Grant access to deals using the button above
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Deal</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPermissions.map((permission) => {
                const activePermissions = getActivePermissions(permission);
                return (
                  <TableRow key={permission.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="font-medium">
                          {permission.dealName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {activePermissions.length > 0 ? (
                          activePermissions.map(
                            ({ key, label, icon: Icon, badgeVariant }) => (
                              <Badge
                                key={key}
                                variant={badgeVariant}
                                className="text-xs gap-1"
                              >
                                <Icon className="h-3 w-3" aria-hidden="true" />
                                {label}
                              </Badge>
                            ),
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No permissions
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(permission.grantedAt)}
                        {permission.grantedByName && (
                          <span className="block text-xs mt-0.5">
                            by {permission.grantedByName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Revoke access to ${permission.dealName}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke access to &quot;
                              {permission.dealName}&quot;? This action will be
                              logged in the audit trail.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={revokePermissionMutation.isPending}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRevokePermission(
                                  permission.dealId,
                                  permission.dealName,
                                )
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={revokePermissionMutation.isPending}
                            >
                              {revokePermissionMutation.isPending ? (
                                <>
                                  <Loader2
                                    className="h-4 w-4 mr-2 animate-spin"
                                    aria-hidden="true"
                                  />
                                  Revoking...
                                </>
                              ) : (
                                "Revoke Access"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

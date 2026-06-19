
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Building2,
  Lock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ClearanceStatus =
  | "pending"
  | "cleared"
  | "cleared_with_conditions"
  | "rejected";

type ClearanceFormProps = {
  investorId: string;
  currentStatus: ClearanceStatus | null;
  currentConditions: string[] | null;
  currentNotes: string | null;
  isOnboardingCompleted: boolean;
};

const STATUS_OPTIONS: {
  value: ClearanceStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "pending", label: "Pending Review", icon: null },
  {
    value: "cleared",
    label: "Cleared",
    icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
  },
  {
    value: "cleared_with_conditions",
    label: "Cleared with Conditions",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: <ShieldX className="h-4 w-4 text-red-600" />,
  },
];

const COMMON_CONDITIONS = [
  "Investment cap: $250,000 per deal",
  "Investment cap: $500,000 per deal",
  "Investment cap: $1,000,000 per deal",
  "Required: Enhanced due diligence for transactions over $100,000",
  "Required: Source of funds documentation for each investment",
  "Restricted: No access to offshore vehicle investments",
  "Restricted: Real estate deals only",
  "Required: Annual re-verification of accreditation status",
  "Required: Quarterly portfolio review call",
] as const;

type StatusAlertConfig = {
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  title: string;
  description: string;
};

const STATUS_ALERT_CONFIG: Record<ClearanceStatus, StatusAlertConfig> = {
  cleared: {
    icon: Building2,
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "!text-green-600",
    textColor: "text-green-800 dark:text-green-200",
    title: "Full Access",
    description:
      "This investor will be granted access to all non-draft deals with full permissions (view docs, express interest, invest).",
  },
  cleared_with_conditions: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "!text-amber-600",
    textColor: "text-amber-800 dark:text-amber-200",
    title: "Conditional Access",
    description:
      "This investor will see all deals but with restricted permissions (no document access, cannot invest). Use the Permissions tab to grant additional access to specific deals.",
  },
  pending: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "!text-blue-600",
    textColor: "text-blue-800 dark:text-blue-200",
    title: "Pending",
    description:
      "This investor cannot see any deals in the marketplace while their clearance is pending review.",
  },
  rejected: {
    icon: Lock,
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "!text-red-600",
    textColor: "text-red-800 dark:text-red-200",
    title: "Blocked",
    description:
      "This investor will be completely blocked from accessing any deals in the marketplace.",
  },
};

export function ClearanceForm({
  investorId,
  currentStatus,
  currentConditions,
  currentNotes,
  isOnboardingCompleted,
}: ClearanceFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ClearanceStatus>(
    currentStatus || "pending"
  );
  const [conditions, setConditions] = useState<string[]>(
    currentConditions || []
  );
  const [customCondition, setCustomCondition] = useState("");
  const [notes, setNotes] = useState(currentNotes || "");

  // Sync state when props change
  useEffect(() => {
    if (currentStatus) {
      setStatus(currentStatus);
    }
  }, [currentStatus]);

  useEffect(() => {
    if (currentConditions) {
      setConditions(currentConditions);
    }
  }, [currentConditions]);

  useEffect(() => {
    if (currentNotes !== null) {
      setNotes(currentNotes);
    }
  }, [currentNotes]);

  // Memoized computed values
  const canGrantClearance = useMemo(
    () => isOnboardingCompleted,
    [isOnboardingCompleted]
  );
  const isGrantingClearanceStatus = useMemo(
    () => status === "cleared" || status === "cleared_with_conditions",
    [status]
  );
  const availableConditions = useMemo(
    () => COMMON_CONDITIONS.filter((c) => !conditions.includes(c)),
    [conditions]
  );
  const statusAlertConfig = useMemo(
    () => STATUS_ALERT_CONFIG[status],
    [status]
  );
  const isValidStatus = useMemo(() => {
    if (status === "cleared" || status === "cleared_with_conditions") {
      return isOnboardingCompleted;
    }
    return true;
  }, [status, isOnboardingCompleted]);
  const requiresConditions = useMemo(
    () => status === "cleared_with_conditions",
    [status]
  );

  const setClearanceMutation = useMutation(
    trpc.compliance.setClearance.mutationOptions({
      onSuccess: () => {
        toast.success("Clearance status updated successfully");
        queryClient.invalidateQueries({ queryKey: [["compliance"]] });
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update clearance status");
      },
    })
  );

  const handleSubmit = useCallback(() => {
    // Validation
    if (!isValidStatus) {
      toast.error("Cannot grant clearance without completed onboarding");
      return;
    }

    if (requiresConditions && conditions.length === 0) {
      toast.error(
        "Please add at least one condition for conditional clearance"
      );
      return;
    }

    setClearanceMutation.mutate({
      userId: investorId,
      status,
      conditions: requiresConditions ? conditions : undefined,
      notes: notes.trim() || undefined,
    });
  }, [
    isValidStatus,
    requiresConditions,
    conditions,
    investorId,
    status,
    notes,
    setClearanceMutation,
  ]);

  const addCondition = useCallback(
    (condition: string) => {
      if (condition && !conditions.includes(condition)) {
        setConditions((prev) => [...prev, condition]);
      }
    },
    [conditions]
  );

  const removeCondition = useCallback((condition: string) => {
    setConditions((prev) => prev.filter((c) => c !== condition));
  }, []);

  const addCustomCondition = useCallback(() => {
    const trimmed = customCondition.trim();
    if (trimmed) {
      addCondition(trimmed);
      setCustomCondition("");
    }
  }, [customCondition, addCondition]);

  const handleStatusChange = useCallback((value: string) => {
    const newStatus = value as ClearanceStatus;
    setStatus(newStatus);

    // Clear conditions if status changes away from cleared_with_conditions
    if (newStatus !== "cleared_with_conditions") {
      setConditions([]);
    }
  }, []);

  const handleBadgeKeyDown = useCallback(
    (event: React.KeyboardEvent, condition: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        removeCondition(condition);
      }
    },
    [removeCondition]
  );

  return (
    <section className="flex flex-col gap-5 border-y border-border py-5">
      <header className="space-y-1.5">
        <h2 className="text-base font-semibold leading-none">Set Clearance Status</h2>
        <p className="text-sm text-muted-foreground">
          Review the investor&apos;s KYC information and set their clearance status
        </p>
      </header>
      <div className="space-y-6">
        {/* KYC Incomplete Warning */}
        {!isOnboardingCompleted && (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>KYC Not Complete:</strong> This investor has not completed
              their onboarding/KYC submission. Clearance cannot be granted until
              onboarding is complete. You can only set status to &quot;Pending
              Review&quot; or &quot;Rejected&quot;.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status">Clearance Status</Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status" aria-label="Select clearance status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => {
                const requiresKyc =
                  option.value === "cleared" ||
                  option.value === "cleared_with_conditions";
                const isDisabled = requiresKyc && !isOnboardingCompleted;

                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                      {isDisabled && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (Requires KYC)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Access Implications Alert */}
        <Alert
          className={`${statusAlertConfig.bgColor} ${statusAlertConfig.borderColor}`}
          role="status"
          aria-live="polite"
        >
          <statusAlertConfig.icon
            className={`h-4 w-4 ${statusAlertConfig.iconColor}`}
          />
          <AlertDescription className={statusAlertConfig.textColor}>
            <strong>{statusAlertConfig.title}:</strong>{" "}
            {statusAlertConfig.description}
          </AlertDescription>
        </Alert>

        {/* Conditions (only for cleared_with_conditions) */}
        {requiresConditions && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions</Label>
              <p className="text-sm text-muted-foreground">
                Add conditions that will apply to this investor&apos;s access
              </p>
            </div>

            {/* Selected Conditions */}
            {conditions.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Selected conditions"
              >
                {conditions.map((condition) => (
                  <Badge
                    key={condition}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => removeCondition(condition)}
                    onKeyDown={(e) => handleBadgeKeyDown(e, condition)}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`Remove condition: ${condition}`}
                  >
                    {condition} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Conditions */}
            <div className="space-y-2">
              <Label className="text-sm">Common Conditions</Label>
              <div
                className="grid grid-cols-1 gap-2"
                role="group"
                aria-label="Available conditions"
              >
                {availableConditions.map((condition) => (
                  <Button
                    key={condition}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 text-left whitespace-normal"
                    onClick={() => addCondition(condition)}
                    aria-label={`Add condition: ${condition}`}
                  >
                    + {condition}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Condition */}
            <div className="space-y-2">
              <Label htmlFor="custom-condition">Add Custom Condition</Label>
              <div className="flex gap-2">
                <Textarea
                  id="custom-condition"
                  placeholder="Enter a custom condition..."
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      addCustomCondition();
                    }
                  }}
                  className="min-h-[60px]"
                  aria-describedby="custom-condition-help"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomCondition}
                  disabled={!customCondition.trim()}
                  aria-label="Add custom condition"
                >
                  Add
                </Button>
              </div>
              <p
                id="custom-condition-help"
                className="text-xs text-muted-foreground"
              >
                Press Cmd/Ctrl + Enter to quickly add
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add internal notes about this clearance decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            These notes are for internal use only and will not be shown to the
            investor
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={setClearanceMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              setClearanceMutation.isPending ||
              (isGrantingClearanceStatus && !canGrantClearance) ||
              !isValidStatus
            }
            aria-label="Update clearance status"
          >
            {setClearanceMutation.isPending && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Update Clearance
          </Button>
        </div>
      </div>
    </section>
  );
}

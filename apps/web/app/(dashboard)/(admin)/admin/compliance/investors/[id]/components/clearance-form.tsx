"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ClearanceStatus = "pending" | "cleared" | "cleared_with_conditions" | "rejected";

type ClearanceFormProps = {
  investorId: string;
  currentStatus: ClearanceStatus | null;
  currentConditions: string[] | null;
  currentNotes: string | null;
};

const STATUS_OPTIONS: { value: ClearanceStatus; label: string; icon: React.ReactNode }[] = [
  { value: "pending", label: "Pending Review", icon: null },
  { value: "cleared", label: "Cleared", icon: <ShieldCheck className="h-4 w-4 text-green-600" /> },
  { value: "cleared_with_conditions", label: "Cleared with Conditions", icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
  { value: "rejected", label: "Rejected", icon: <ShieldX className="h-4 w-4 text-red-600" /> },
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
];

export function ClearanceForm({
  investorId,
  currentStatus,
  currentConditions,
  currentNotes,
}: ClearanceFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ClearanceStatus>(currentStatus || "pending");
  const [conditions, setConditions] = useState<string[]>(currentConditions || []);
  const [customCondition, setCustomCondition] = useState("");
  const [notes, setNotes] = useState(currentNotes || "");

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

  const handleSubmit = () => {
    setClearanceMutation.mutate({
      userId: investorId,
      status,
      conditions: status === "cleared_with_conditions" ? conditions : undefined,
      notes: notes || undefined,
    });
  };

  const addCondition = (condition: string) => {
    if (condition && !conditions.includes(condition)) {
      setConditions([...conditions, condition]);
    }
  };

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter((c) => c !== condition));
  };

  const addCustomCondition = () => {
    if (customCondition.trim()) {
      addCondition(customCondition.trim());
      setCustomCondition("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Clearance Status</CardTitle>
        <CardDescription>
          Review the investor&apos;s KYC information and set their clearance status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status">Clearance Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ClearanceStatus)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditions (only for cleared_with_conditions) */}
        {status === "cleared_with_conditions" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conditions</Label>
              <p className="text-sm text-muted-foreground">
                Add conditions that will apply to this investor&apos;s access
              </p>
            </div>

            {/* Selected Conditions */}
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition) => (
                  <Badge
                    key={condition}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeCondition(condition)}
                  >
                    {condition} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Conditions */}
            <div className="space-y-2">
              <Label className="text-sm">Common Conditions</Label>
              <div className="grid grid-cols-1 gap-2">
                {COMMON_CONDITIONS.filter((c) => !conditions.includes(c)).map((condition) => (
                  <Button
                    key={condition}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 text-left whitespace-normal"
                    onClick={() => addCondition(condition)}
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
                  className="min-h-[60px]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomCondition}
                  disabled={!customCondition.trim()}
                >
                  Add
                </Button>
              </div>
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
            These notes are for internal use only and will not be shown to the investor
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={setClearanceMutation.isPending}
          >
            {setClearanceMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Clearance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

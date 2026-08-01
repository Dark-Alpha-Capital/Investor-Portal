import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Info,
  FileQuestion,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ClearanceStatus =
  | "pending_review"
  | "approved"
  | "needs_information"
  | "rejected";

type ClearanceFormProps = {
  investorId: string;
  currentStatus: ClearanceStatus | null;
  currentConditions: string[] | null;
  currentNotes: string | null;
  currentInvestorVisibleNotes?: string | null;
  isOnboardingCompleted: boolean;
};

const STATUS_OPTIONS: {
  value: ClearanceStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "pending_review", label: "Pending Review", icon: null },
  {
    value: "approved",
    label: "Approved",
    icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
  },
  {
    value: "needs_information",
    label: "Needs Information",
    icon: <FileQuestion className="h-4 w-4 text-amber-600" />,
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: <ShieldX className="h-4 w-4 text-red-600" />,
  },
];

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
  approved: {
    icon: ShieldCheck,
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "!text-green-600",
    textColor: "text-green-800 dark:text-green-200",
    title: "Approved",
    description:
      "Investor has passed KYC and is eligible to invest. Invite them to specific deals from the Invitations tab.",
  },
  needs_information: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "!text-amber-600",
    textColor: "text-amber-800 dark:text-amber-200",
    title: "Needs Information",
    description:
      "Additional documents or corrections are required before approval. The investor cannot access deals until re-approved.",
  },
  pending_review: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "!text-blue-600",
    textColor: "text-blue-800 dark:text-blue-200",
    title: "Pending Review",
    description:
      "KYC has been submitted and is awaiting review. The investor cannot see deals until approved.",
  },
  rejected: {
    icon: ShieldX,
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "!text-red-600",
    textColor: "text-red-800 dark:text-red-200",
    title: "Rejected",
    description: "This investor cannot participate in the portal.",
  },
};

export function ClearanceForm({
  investorId,
  currentStatus,
  currentNotes,
  currentInvestorVisibleNotes,
  isOnboardingCompleted,
}: ClearanceFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ClearanceStatus>(
    currentStatus ?? "pending_review"
  );
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [investorVisibleNotes, setInvestorVisibleNotes] = useState(
    currentInvestorVisibleNotes ?? ""
  );

  useEffect(() => {
    setStatus(currentStatus ?? "pending_review");
    setNotes(currentNotes ?? "");
    setInvestorVisibleNotes(currentInvestorVisibleNotes ?? "");
  }, [currentStatus, currentNotes, currentInvestorVisibleNotes]);

  const setClearanceMutation = useMutation(
    trpc.compliance.setClearance.mutationOptions({
      onSuccess: () => {
        toast.success("Investor status updated");
        queryClient.invalidateQueries();
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update status");
      },
    })
  );

  const canApprove = isOnboardingCompleted;
  const alertConfig = STATUS_ALERT_CONFIG[status];
  const AlertIcon = alertConfig.icon;

  const handleSubmit = useCallback(() => {
    if (status === "approved" && !canApprove) {
      toast.error("Investor must complete onboarding before approval");
      return;
    }

    setClearanceMutation.mutate({
      userId: investorId,
      status,
      notes: notes.trim() || undefined,
      investorVisibleNotes: investorVisibleNotes.trim() || undefined,
    });
  }, [
    status,
    canApprove,
    investorId,
    notes,
    investorVisibleNotes,
    setClearanceMutation,
  ]);

  const statusChanged = status !== (currentStatus ?? "pending_review");
  const notesChanged = notes.trim() !== (currentNotes ?? "").trim();
  const investorNotesChanged =
    investorVisibleNotes.trim() !==
    (currentInvestorVisibleNotes ?? "").trim();
  const hasChanges = statusChanged || notesChanged || investorNotesChanged;

  const submitLabel = useMemo(() => {
    if (setClearanceMutation.isPending) return "Saving…";
    if (!hasChanges) return "No changes";
    return "Update Status";
  }, [setClearanceMutation.isPending, hasChanges]);

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div>
        <h2 className="text-lg font-semibold">Global Status</h2>
        <p className="text-sm text-muted-foreground">
          Set the investor&apos;s overall approval status. Deal invitations are
          managed separately.
        </p>
      </div>

      {!isOnboardingCompleted && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Onboarding is incomplete. Approval is blocked until KYC is
            submitted.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ClearanceStatus)}
        >
          <SelectTrigger id="status" className="w-full max-w-md">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.value === "approved" && !canApprove}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={`rounded-md border p-4 ${alertConfig.bgColor} ${alertConfig.borderColor}`}
      >
        <div className="flex gap-3">
          <AlertIcon className={`mt-0.5 h-5 w-5 ${alertConfig.iconColor}`} />
          <div>
            <p className={`font-medium ${alertConfig.textColor}`}>
              {alertConfig.title}
            </p>
            <p className={`text-sm ${alertConfig.textColor} opacity-90`}>
              {alertConfig.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for compliance team only"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="investor-notes">Investor-visible notes</Label>
        <Textarea
          id="investor-notes"
          value={investorVisibleNotes}
          onChange={(e) => setInvestorVisibleNotes(e.target.value)}
          placeholder="Optional message shown to the investor"
          rows={2}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={setClearanceMutation.isPending || !hasChanges}
      >
        {setClearanceMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {submitLabel}
      </Button>
    </div>
  );
}

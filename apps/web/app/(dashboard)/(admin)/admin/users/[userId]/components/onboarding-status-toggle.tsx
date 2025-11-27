"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_more_info";

interface OnboardingStatusToggleProps {
  onboardingId: string;
  currentStatus: OnboardingStatus | null;
}

const statusConfig: Record<
  OnboardingStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  draft: {
    label: "Draft",
    variant: "outline",
    icon: <FileText className="w-3 h-3" />,
  },
  submitted: {
    label: "Submitted",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  under_review: {
    label: "Under Review",
    variant: "secondary",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
  needs_more_info: {
    label: "Needs More Info",
    variant: "outline",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

export function OnboardingStatusToggle({
  onboardingId,
  currentStatus,
}: OnboardingStatusToggleProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OnboardingStatus>(
    (currentStatus as OnboardingStatus) || "draft"
  );
  const [isPending, startTransition] = useTransition();

  // Sync with server state when currentStatus changes
  useEffect(() => {
    if (currentStatus && currentStatus !== selectedStatus) {
      setSelectedStatus(currentStatus as OnboardingStatus);
    }
  }, [currentStatus]);

  const handleStatusChange = (newStatus: OnboardingStatus) => {
    if (newStatus === selectedStatus) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/onboarding/${onboardingId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to update onboarding status");
        }

        setSelectedStatus(newStatus);
        router.refresh();
        toast.success("Investor application status updated", {
          description: `Status changed to ${statusConfig[newStatus].label}`,
        });
      } catch (error) {
        console.error("Error updating onboarding status:", error);
        toast.error("Failed to update application status", {
          description:
            error instanceof Error ? error.message : "An error occurred",
        });
        // Revert to previous status on error
        setSelectedStatus(selectedStatus);
      }
    });
  };

  const currentConfig = statusConfig[selectedStatus];

  return (
    <Select
      value={selectedStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[200px]" size="sm">
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating...</span>
          </div>
        ) : (
          <SelectValue>
            <div className="flex items-center gap-2">
              {currentConfig.icon}
              <span>{currentConfig.label}</span>
            </div>
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">
          <FileText className="w-4 h-4 mr-2" />
          Draft
        </SelectItem>
        <SelectItem value="submitted">
          <Clock className="w-4 h-4 mr-2" />
          Submitted
        </SelectItem>
        <SelectItem value="under_review">
          <AlertCircle className="w-4 h-4 mr-2" />
          Under Review
        </SelectItem>
        <SelectItem value="approved">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Approved
        </SelectItem>
        <SelectItem value="rejected">
          <XCircle className="w-4 h-4 mr-2" />
          Rejected
        </SelectItem>
        <SelectItem value="needs_more_info">
          <AlertCircle className="w-4 h-4 mr-2" />
          Needs More Info
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type KycStatus = "review" | "approved" | "pending_docs" | "rejected";

interface KycStatusToggleProps {
  userId: string;
  currentStatus: KycStatus | null;
}

const statusConfig: Record<
  KycStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  review: {
    label: "Under Review",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending_docs: {
    label: "Pending Documents",
    variant: "outline",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function KycStatusToggle({
  userId,
  currentStatus,
}: KycStatusToggleProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<KycStatus>(
    (currentStatus as KycStatus) || "review"
  );
  const [isPending, startTransition] = useTransition();

  // Sync with server state when currentStatus changes
  useEffect(() => {
    if (currentStatus && currentStatus !== selectedStatus) {
      setSelectedStatus(currentStatus as KycStatus);
    }
  }, [currentStatus, selectedStatus]);

  const handleStatusChange = (newStatus: KycStatus) => {
    if (newStatus === selectedStatus) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${userId}/kyc-status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ kycStatus: newStatus }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to update KYC status");
        }

        setSelectedStatus(newStatus);
        router.refresh();
        toast.success("KYC status updated", {
          description: `Status changed to ${statusConfig[newStatus].label}`,
        });
      } catch (error) {
        console.error("Error updating KYC status:", error);
        toast.error("Failed to update KYC status", {
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
        <SelectItem value="review">
          <Clock className="w-4 h-4 mr-2" />
          Under Review
        </SelectItem>
        <SelectItem value="approved">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Approved
        </SelectItem>
        <SelectItem value="pending_docs">
          <AlertCircle className="w-4 h-4 mr-2" />
          Pending Documents
        </SelectItem>
        <SelectItem value="rejected">
          <XCircle className="w-4 h-4 mr-2" />
          Rejected
        </SelectItem>
      </SelectContent>
    </Select>
  );
}


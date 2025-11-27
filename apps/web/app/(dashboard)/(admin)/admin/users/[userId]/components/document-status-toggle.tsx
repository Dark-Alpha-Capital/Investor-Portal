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
  FileX,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "incorrect_doc"
  | "needs_revision";

interface DocumentStatusToggleProps {
  documentId: string;
  currentStatus: DocumentStatus | null;
}

const statusConfig: Record<
  DocumentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="w-3 h-3" />,
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
  incorrect_doc: {
    label: "Incorrect Document",
    variant: "destructive",
    icon: <FileX className="w-3 h-3" />,
  },
  needs_revision: {
    label: "Needs Revision",
    variant: "secondary",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

export function DocumentStatusToggle({
  documentId,
  currentStatus,
}: DocumentStatusToggleProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(
    (currentStatus as DocumentStatus) || "pending"
  );
  const [isPending, startTransition] = useTransition();

  // Sync with server state when currentStatus changes
  useEffect(() => {
    if (currentStatus && currentStatus !== selectedStatus) {
      setSelectedStatus(currentStatus as DocumentStatus);
    }
  }, [currentStatus]);

  const handleStatusChange = (newStatus: DocumentStatus) => {
    if (newStatus === selectedStatus) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to update document status");
        }

        setSelectedStatus(newStatus);
        router.refresh();
        toast.success("Document status updated", {
          description: `Status changed to ${statusConfig[newStatus].label}`,
        });
      } catch (error) {
        console.error("Error updating document status:", error);
        toast.error("Failed to update document status", {
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
      <SelectTrigger className="w-[180px]" size="sm">
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
        <SelectItem value="pending">
          <Clock className="w-4 h-4 mr-2" />
          Pending
        </SelectItem>
        <SelectItem value="approved">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Approved
        </SelectItem>
        <SelectItem value="rejected">
          <XCircle className="w-4 h-4 mr-2" />
          Rejected
        </SelectItem>
        <SelectItem value="incorrect_doc">
          <FileX className="w-4 h-4 mr-2" />
          Incorrect Document
        </SelectItem>
        <SelectItem value="needs_revision">
          <AlertCircle className="w-4 h-4 mr-2" />
          Needs Revision
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

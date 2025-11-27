import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileX,
} from "lucide-react";

export const getKycStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    pending_docs: { variant: "outline", label: "Pending Documents" },
    rejected: { variant: "destructive", label: "Rejected" },
  };

  const config = statusConfig[status || "review"] || statusConfig.review;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const getOnboardingStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    draft: {
      variant: "outline",
      label: "Draft",
      icon: <FileText className="w-3 h-3" />,
    },
    submitted: {
      variant: "secondary",
      label: "Submitted",
      icon: <Clock className="w-3 h-3" />,
    },
    under_review: {
      variant: "secondary",
      label: "Under Review",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    approved: {
      variant: "default",
      label: "Approved",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      icon: <XCircle className="w-3 h-3" />,
    },
    needs_more_info: {
      variant: "outline",
      label: "Needs More Info",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = statusConfig[status || "draft"] || statusConfig.draft;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const getDocumentStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      variant: "outline",
      label: "Pending",
      icon: <Clock className="w-3 h-3" />,
    },
    approved: {
      variant: "default",
      label: "Approved",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      icon: <XCircle className="w-3 h-3" />,
    },
    incorrect_doc: {
      variant: "destructive",
      label: "Incorrect Document",
      icon: <FileX className="w-3 h-3" />,
    },
    needs_revision: {
      variant: "secondary",
      label: "Needs Revision",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = statusConfig[status || "pending"] || statusConfig.pending;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const formatFileSize = (size: string) => {
  const bytes = parseInt(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

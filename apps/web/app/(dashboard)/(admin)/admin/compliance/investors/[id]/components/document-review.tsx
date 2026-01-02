"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "incorrect_doc"
  | "needs_revision";

type OnboardingDocument = {
  id: string;
  documentType: string;
  fileName: string | null;
  fileType: string | null;
  filePath: string | null;
  fileUrl: string | null;
  status: string | null;
  uploadedAt: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  [key: string]: unknown;
};

type DocumentReviewProps = {
  documents: OnboardingDocument[];
  investorId: string;
};

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  pending: { label: "Pending Review", variant: "secondary", icon: RefreshCw },
  approved: { label: "Approved", variant: "default", icon: Check },
  rejected: { label: "Rejected", variant: "destructive", icon: X },
  incorrect_doc: { label: "Incorrect Document", variant: "destructive", icon: AlertTriangle },
  needs_revision: { label: "Needs Revision", variant: "outline", icon: RefreshCw },
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  identification: "Government ID / Passport",
  w9OrW8BEN: "W-9 / W-8BEN Tax Form",
  proofOfAddress: "Proof of Address",
  accreditationProof: "Accreditation Proof",
  entityFormationDocs: "Entity Formation Documents",
  operatingAgreement: "Operating Agreement",
  certificateOfIncumbency: "Certificate of Incumbency",
  bankStatement: "Bank Statement",
  sourceOfFunds: "Source of Funds Documentation",
  other: "Other Document",
};

function formatDocumentType(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, " ");
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: string | number | null): string {
  if (!bytes) return "Unknown size";
  const size = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentReview({ documents, investorId }: DocumentReviewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<OnboardingDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DocumentStatus | null>(null);

  // Mutation for reviewing a document
  const reviewMutation = useMutation(
    trpc.compliance.reviewDocument.mutationOptions({
      onSuccess: () => {
        toast.success("Document status updated");
        queryClient.invalidateQueries({ queryKey: ["compliance", "getInvestorDetails"] });
        setIsReviewDialogOpen(false);
        setSelectedDoc(null);
        setReviewNotes("");
        setPendingStatus(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update document status");
      },
    })
  );

  // Bulk approve mutation
  const bulkReviewMutation = useMutation(
    trpc.compliance.bulkReviewDocuments.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["compliance", "getInvestorDetails"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update documents");
      },
    })
  );

  const handleStatusChange = (doc: OnboardingDocument, status: DocumentStatus) => {
    if (status === "rejected" || status === "incorrect_doc" || status === "needs_revision") {
      // For negative statuses, open dialog to add notes
      setSelectedDoc(doc);
      setPendingStatus(status);
      setIsReviewDialogOpen(true);
    } else {
      // For approve/pending, update immediately
      reviewMutation.mutate({
        documentId: doc.id,
        status,
      });
    }
  };

  const handleConfirmReview = () => {
    if (!selectedDoc || !pendingStatus) return;
    reviewMutation.mutate({
      documentId: selectedDoc.id,
      status: pendingStatus,
      reviewNotes: reviewNotes || undefined,
    });
  };

  const handleBulkApprove = () => {
    const pendingDocs = documents.filter((d) => d.status === "pending" || !d.status);
    if (pendingDocs.length === 0) {
      toast.info("No pending documents to approve");
      return;
    }
    bulkReviewMutation.mutate({
      documentIds: pendingDocs.map((d) => d.id),
      status: "approved",
    });
  };

  const pendingCount = documents.filter((d) => d.status === "pending" || !d.status).length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const rejectedCount = documents.filter(
    (d) => d.status === "rejected" || d.status === "incorrect_doc" || d.status === "needs_revision"
  ).length;

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KYC Documents</CardTitle>
          <CardDescription>No documents uploaded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <FileText className="h-8 w-8 opacity-50" />
            <span>This investor has not uploaded any documents yet.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">KYC Documents</CardTitle>
              <CardDescription>
                {documents.length} document(s) • {approvedCount} approved • {pendingCount} pending • {rejectedCount} rejected
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkReviewMutation.isPending}
              >
                {bulkReviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve All Pending ({pendingCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => {
              const status = (doc.status as DocumentStatus) || "pending";
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;

              return (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {formatDocumentType(doc.documentType)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.fileName || "Unnamed file"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded: {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <Badge variant={config.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>

                    {/* Status Selector */}
                    <Select
                      value={status}
                      onValueChange={(value) => handleStatusChange(doc, value as DocumentStatus)}
                      disabled={reviewMutation.isPending}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3" />
                            Pending Review
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            Approve
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <X className="h-3 w-3 text-red-600" />
                            Reject
                          </div>
                        </SelectItem>
                        <SelectItem value="incorrect_doc">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Incorrect Document
                          </div>
                        </SelectItem>
                        <SelectItem value="needs_revision">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                            Needs Revision
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Download/View Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a
                        href={`/api/documents/download?id=${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Review Notes Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === "rejected"
                ? "Reject Document"
                : pendingStatus === "incorrect_doc"
                  ? "Mark as Incorrect Document"
                  : "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc && (
                <>
                  Document: <strong>{formatDocumentType(selectedDoc.documentType)}</strong>
                  <br />
                  File: {selectedDoc.fileName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Review Notes (optional)
              </label>
              <Textarea
                placeholder="Enter reason for rejection or instructions for revision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewDialogOpen(false);
                setSelectedDoc(null);
                setReviewNotes("");
                setPendingStatus(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={pendingStatus === "needs_revision" ? "default" : "destructive"}
              onClick={handleConfirmReview}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

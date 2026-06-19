
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
import {
  FileText,
  Download,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  pending: { label: "Pending Review", variant: "secondary", icon: RefreshCw },
  approved: { label: "Approved", variant: "default", icon: Check },
  rejected: { label: "Rejected", variant: "destructive", icon: X },
  incorrect_doc: {
    label: "Incorrect Document",
    variant: "destructive",
    icon: AlertTriangle,
  },
  needs_revision: {
    label: "Needs Revision",
    variant: "outline",
    icon: RefreshCw,
  },
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

export function DocumentReview({ documents, investorId }: DocumentReviewProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<OnboardingDocument | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DocumentStatus | null>(
    null
  );

  // Mutation for reviewing a document
  const reviewMutation = useMutation(
    trpc.compliance.reviewDocument.mutationOptions({
      onSuccess: () => {
        toast.success("Document status updated");
        // Invalidate React Query cache
        queryClient.invalidateQueries({
          queryKey: ["compliance", "getInvestorDetails"],
        });
        // Refresh server components to get fresh data (cache revalidation happens in the mutation handler)
        router.refresh();
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
        // Invalidate React Query cache
        queryClient.invalidateQueries({
          queryKey: ["compliance", "getInvestorDetails"],
        });
        // Refresh server components to get fresh data (cache revalidation happens in the mutation handler)
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update documents");
      },
    })
  );

  // Memoize document counts to avoid recalculating on every render
  const { pendingCount, approvedCount, rejectedCount, pendingDocs } =
    useMemo(() => {
      const pending = documents.filter(
        (d) => d.status === "pending" || !d.status
      );
      const approved = documents.filter((d) => d.status === "approved");
      const rejected = documents.filter(
        (d) =>
          d.status === "rejected" ||
          d.status === "incorrect_doc" ||
          d.status === "needs_revision"
      );

      return {
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        pendingDocs: pending,
      };
    }, [documents]);

  const handleStatusChange = useCallback(
    (doc: OnboardingDocument, status: DocumentStatus) => {
      if (
        status === "rejected" ||
        status === "incorrect_doc" ||
        status === "needs_revision"
      ) {
        // For negative statuses, open dialog to add notes
        setSelectedDoc(doc);
        setPendingStatus(status);
        setIsReviewDialogOpen(true);
      } else {
        // For approve/pending, update immediately
        reviewMutation.mutate({
          documentId: doc.id,
          status,
          investorId,
        });
      }
    },
    [reviewMutation]
  );

  const handleConfirmReview = useCallback(() => {
    if (!selectedDoc || !pendingStatus) return;
    reviewMutation.mutate({
      documentId: selectedDoc.id,
      status: pendingStatus,
      reviewNotes: reviewNotes || undefined,
      investorId,
    });
  }, [selectedDoc, pendingStatus, reviewNotes, reviewMutation, investorId]);

  const handleBulkApprove = useCallback(() => {
    if (pendingDocs.length === 0) {
      toast.info("No pending documents to approve");
      return;
    }
    bulkReviewMutation.mutate({
      documentIds: pendingDocs.map((d) => d.id),
      status: "approved",
      investorId,
    });
  }, [pendingDocs, bulkReviewMutation, investorId]);

  const handleDialogClose = useCallback(() => {
    setIsReviewDialogOpen(false);
    setSelectedDoc(null);
    setReviewNotes("");
    setPendingStatus(null);
  }, []);

  if (documents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">KYC Documents</h2>
            <p className="text-sm text-muted-foreground">
              No documents uploaded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center border rounded-lg">
          <FileText className="h-8 w-8 opacity-50" />
          <span>This investor has not uploaded any documents yet.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">KYC Documents</h2>
            <p className="text-sm text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? "s" : ""} •{" "}
              {approvedCount} approved • {pendingCount} pending •{" "}
              {rejectedCount} rejected
            </p>
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

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-[300px]">Document</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[180px]">Uploaded</TableHead>
                <TableHead className="w-[180px]">Action</TableHead>
                <TableHead className="text-right w-[100px]">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, index) => {
                const status = (doc.status as DocumentStatus) || "pending";
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;

                return (
                  <TableRow key={doc.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">
                            {formatDocumentType(doc.documentType)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.fileName || "Unnamed file"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={status}
                        onValueChange={(value) => {
                          handleStatusChange(doc, value as DocumentStatus);
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <RefreshCw className="h-3 w-3" />
                            Pending Review
                          </SelectItem>
                          <SelectItem value="approved">
                            <Check className="h-3 w-3 text-green-600" />
                            Approve
                          </SelectItem>
                          <SelectItem value="rejected">
                            <X className="h-3 w-3 text-red-600" />
                            Reject
                          </SelectItem>
                          <SelectItem value="incorrect_doc">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Incorrect Document
                          </SelectItem>
                          <SelectItem value="needs_revision">
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                            Needs Revision
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

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
                  Document:{" "}
                  <strong>
                    {formatDocumentType(selectedDoc.documentType)}
                  </strong>
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
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              variant={
                pendingStatus === "needs_revision" ? "default" : "destructive"
              }
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

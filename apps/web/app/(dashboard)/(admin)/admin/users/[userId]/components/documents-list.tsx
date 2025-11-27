import { FileText } from "lucide-react";
import { format } from "date-fns";
import { formatFileSize, getDocumentStatusBadge } from "./utils";
import { DocumentActions } from "./document-actions";
import { DocumentStatusToggle } from "./document-status-toggle";
import { Separator } from "@/components/ui/separator";

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: Date | null;
  fileUrl: string | null;
  status: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

interface DocumentsListProps {
  documents: Document[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, idx) => (
        <div key={doc.id}>
          <div className="flex items-start justify-between py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium capitalize">
                  {doc.documentType.replace(/([A-Z])/g, " $1").trim()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground ml-6">
                <p className="truncate">File: {doc.fileName}</p>
                <p>Size: {formatFileSize(doc.fileSize)}</p>
                <p>Type: {doc.fileType}</p>
                <p>
                  Uploaded:{" "}
                  {doc.uploadedAt
                    ? format(new Date(doc.uploadedAt), "PPP")
                    : "N/A"}
                </p>
                {doc.status && doc.status !== "pending" && (
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    {getDocumentStatusBadge(doc.status)}
                  </div>
                )}
                {doc.reviewedAt && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Reviewed: {format(new Date(doc.reviewedAt), "PPP")}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-4 shrink-0 flex flex-col items-end gap-2">
              <DocumentStatusToggle
                documentId={doc.id}
                currentStatus={
                  doc.status as
                    | "pending"
                    | "approved"
                    | "rejected"
                    | "incorrect_doc"
                    | "needs_revision"
                    | null
                }
              />
              {doc.fileUrl && (
                <DocumentActions
                  documentId={doc.id}
                  fileName={doc.fileName}
                  fileType={doc.fileType}
                />
              )}
            </div>
          </div>
          {idx < documents.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}

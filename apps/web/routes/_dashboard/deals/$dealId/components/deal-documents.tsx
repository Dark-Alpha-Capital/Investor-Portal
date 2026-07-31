import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, File, Loader2, Lock } from "lucide-react";

type DealDocumentsProps = {
  dealId: string;
  canViewDocuments: boolean;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export function DealDocuments({
  dealId,
  canViewDocuments,
}: DealDocumentsProps) {
  const trpc = useTRPC();

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.deals.getFiles.queryOptions({ dealId }),
    enabled: canViewDocuments,
  });

  if (!canViewDocuments) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Document access required</p>
          <p className="text-sm text-muted-foreground">
            You do not have permission to view the data room for this deal.
            Contact your relationship manager to request access.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading documents…
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || "Failed to load documents"}
        </AlertDescription>
      </Alert>
    );
  }

  const files = data?.files ?? [];

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No documents have been uploaded for this deal yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Documents</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead className="hidden sm:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="w-25" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.name}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatDate(file.lastModified)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download {file.name}</span>
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

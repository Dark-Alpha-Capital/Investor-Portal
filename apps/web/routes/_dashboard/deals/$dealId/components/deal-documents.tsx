import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, File, FileText, Lock } from "lucide-react";
import type { DealFile } from "@/lib/deals/list-deal-files";

type DealDocumentsProps = {
  files: DealFile[];
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

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = fileExtension(name);
  if (ext === "pdf") {
    return <FileText className="h-4 w-4 shrink-0 text-red-500" />;
  }
  if (["xlsx", "xls", "csv"].includes(ext)) {
    return <FileText className="h-4 w-4 shrink-0 text-emerald-500" />;
  }
  if (["docx", "doc"].includes(ext)) {
    return <FileText className="h-4 w-4 shrink-0 text-sky-500" />;
  }
  return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function DealDocuments({
  files,
  canViewDocuments,
}: DealDocumentsProps) {
  if (!canViewDocuments) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Data room access required</p>
          <p className="text-sm text-muted-foreground">
            You have teaser access only. Request data room access to review
            documents for this deal.
          </p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No documents have been uploaded for this deal yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">
        Documents
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {files.length}
        </span>
      </h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead className="hidden sm:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.name}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <FileTypeIcon name={file.name} />
                    <span className="truncate font-medium">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatDate(file.lastModified)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${file.name}`}
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
    </section>
  );
}

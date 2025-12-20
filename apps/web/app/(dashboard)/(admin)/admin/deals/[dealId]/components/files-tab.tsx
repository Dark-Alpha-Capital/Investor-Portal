import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, File } from "lucide-react";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return "🖼️";
  } else if (mimeType === "application/pdf") {
    return "📄";
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return "📝";
  } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return "📊";
  } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return "📦";
  }
  return "📎";
};

type FilesTabProps = {
  dealId: string;
  files: Array<{
    name: string;
    size: number;
    lastModified: string;
    mimeType: string;
    downloadUrl: string;
  }>;
  uploadButton?: React.ReactNode;
};

export function FilesTab({ dealId, files, uploadButton }: FilesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deal Files
            </CardTitle>
            <CardDescription>
              Files stored in Nextcloud for this deal
            </CardDescription>
          </div>
          {uploadButton}
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-12">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No files have been uploaded for this deal yet.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={`${file.name}-${index}`}>
                    <TableCell>
                      <span
                        className="text-2xl"
                        role="img"
                        aria-label="file type"
                      >
                        {getFileIcon(file.mimeType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {file.mimeType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {formatFileSize(file.size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(file.lastModified)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

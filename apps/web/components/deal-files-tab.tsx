"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2, AlertCircle, Download, File } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  // Videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/webm",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/rtf",
];

type DealFilesTabProps = {
  dealId: string;
  files: Array<{
    name: string;
    size: number;
    lastModified: string;
    mimeType: string;
    downloadUrl: string;
  }>;
};

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

export function DealFilesTab({ dealId, files }: DealFilesTabProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const { mutate: uploadFile, isPending } = useMutation(
    trpc.deals.uploadFile.mutationOptions({
      onSuccess: () => {
        toast.success("File uploaded successfully");
        setIsDialogOpen(false);
        setSelectedFile(null);
        setUploadError(null);
        // Refresh the page to show new file
        router.refresh();
      },
      onError: (error: unknown) => {
        let errorMessage = "Failed to upload file";

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "data" in error &&
          typeof error.data === "object" &&
          error.data !== null &&
          "message" in error.data &&
          typeof error.data.message === "string"
        ) {
          errorMessage = error.data.message;
        }

        setUploadError(errorMessage);
        toast.error(errorMessage);
      },
    })
  );

  // Validate file before selection
  const validateFile = useCallback((file: File): string | null => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed. Please upload images, videos (mp4), audio files, PDF, documents, or text files.`;
    }

    return null;
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setUploadError(null);

      if (!file) {
        setSelectedFile(null);
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    [validateFile]
  );

  // Convert file to base64 (browser-compatible)
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    try {
      const base64Data = await fileToBase64(selectedFile);

      uploadFile({
        dealId,
        fileName: selectedFile.name,
        fileData: base64Data,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process file";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    }
  }, [selectedFile, fileToBase64, uploadFile, dealId]);

  const handleSelectFile = useCallback((fileName: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedFiles(() => {
        if (checked) {
          return new Set(files.map((file) => file.name));
        }
        return new Set();
      });
    },
    [files]
  );

  const allSelected = useMemo(
    () =>
      files.length > 0 && files.every((file) => selectedFiles.has(file.name)),
    [files, selectedFiles]
  );

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setUploadError(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deal Files</h3>
          <p className="text-sm text-muted-foreground">
            {files.length} {files.length === 1 ? "file" : "files"} stored in
            Nextcloud
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a file to this deal's folder. Maximum file size is 10MB.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  disabled={isPending}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Allowed types: Images, MP4 videos, audio files, PDF, documents
                  (.doc, .docx, .xls, .xlsx, .ppt, .pptx), and text files (.txt,
                  .csv, .rtf)
                </p>
              </div>

              {selectedFile && (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type: {selectedFile.type}
                  </p>
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
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
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked === true)
                    }
                    aria-label="Select all files"
                  />
                </TableHead>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, index) => (
                <TableRow
                  key={`${file.name}-${index}`}
                  className={selectedFiles.has(file.name) ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedFiles.has(file.name)}
                      onCheckedChange={() => handleSelectFile(file.name)}
                      aria-label={`Select ${file.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-medium">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xl" role="img" aria-label="file type">
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
    </div>
  );
}

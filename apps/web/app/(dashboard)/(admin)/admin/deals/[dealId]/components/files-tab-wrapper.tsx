"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FilesTab } from "./files-tab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, AlertCircle } from "lucide-react";
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

type FilesTabWrapperProps = {
  dealId: string;
  files: Array<{
    name: string;
    size: number;
    lastModified: string;
    mimeType: string;
    downloadUrl: string;
  }>;
};

export function FilesTabWrapper({ dealId, files }: FilesTabWrapperProps) {
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
      onError: (error: any) => {
        const errorMessage =
          error?.message || error?.data?.message || "Failed to upload file";
        setUploadError(errorMessage);
        toast.error(errorMessage);
      },
    })
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(
        `File type "${file.type}" is not allowed. Please upload images, videos (mp4), audio files, PDF, documents, or text files.`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    try {
      // Convert file to base64 (browser-compatible)
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

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
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSelectFile = (fileName: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map((file) => file.name)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  return (
    <>
      <FilesTab
        dealId={dealId}
        files={files}
        selectedFiles={selectedFiles}
        onSelectFile={handleSelectFile}
        onSelectAll={handleSelectAll}
        uploadButton={
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
                  Upload a file to this deal's folder. Maximum file size is
                  10MB.
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
                    Allowed types: Images, MP4 videos, audio files, PDF,
                    documents (.doc, .docx, .xls, .xlsx, .ppt, .pptx), and text
                    files (.txt, .csv, .rtf)
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedFile(null);
                    setUploadError(null);
                  }}
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
        }
      />
    </>
  );
}

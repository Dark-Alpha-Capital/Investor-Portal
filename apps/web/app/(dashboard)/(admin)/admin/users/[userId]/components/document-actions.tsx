"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentActionsProps {
  documentId: string;
  fileName: string;
  fileType?: string;
}

export function DocumentActions({
  documentId,
  fileName,
  fileType,
}: DocumentActionsProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const getSignedUrl = async () => {
    try {
      const response = await fetch(
        `/api/documents/access?documentId=${encodeURIComponent(documentId)}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate access URL");
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      throw error;
    }
  };

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const url = await getSignedUrl();
      if (url) {
        setSignedUrl(url);
        setIsDialogOpen(true);
        toast.success("Document loaded", {
          description: "The signed URL will expire in 15 minutes",
        });
      }
    } catch (error) {
      toast.error("Failed to preview document", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Reset signed URL when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      // Clear signed URL after a delay to allow for smooth closing
      const timer = setTimeout(() => {
        setSignedUrl(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen]);

  const handleDownload = async () => {
    setIsLoadingDownload(true);
    try {
      // Use the proxy endpoint to download the file
      // This avoids CORS issues and ensures proper download behavior
      const downloadUrl = `/api/documents/download?documentId=${encodeURIComponent(documentId)}`;

      // Fetch the file through our proxy endpoint
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download file");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);

      toast.success("Document downloaded", {
        description: "The file has been downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoadingDownload(false);
    }
  };

  // Determine how to render the preview based on file type
  const renderPreview = () => {
    if (!signedUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Images - render directly
    if (fileType?.startsWith("image/")) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted p-4 overflow-auto">
          <img
            src={signedUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // PDFs - use iframe
    if (fileType === "application/pdf") {
      return (
        <iframe
          src={signedUrl}
          className="w-full h-full border-0"
          title={fileName}
        />
      );
    }

    // Text files - use iframe
    if (fileType?.startsWith("text/")) {
      return (
        <iframe
          src={signedUrl}
          className="w-full h-full border-0"
          title={fileName}
        />
      );
    }

    // Unsupported file types - show message with download option
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            This file type cannot be previewed in the browser.
          </p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={isLoadingPreview || isLoadingDownload}
        >
          {isLoadingPreview ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isLoadingPreview || isLoadingDownload}
        >
          {isLoadingDownload ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{fileName}</DialogTitle>
            <DialogDescription>
              Document preview (expires in 15 minutes)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden relative min-h-0">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

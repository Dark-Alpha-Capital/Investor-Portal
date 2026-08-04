"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FilePreview } from "./deal-file-preview";
import {
  fileProxyUrl,
  formatFileSize,
  type FileIdentity,
} from "./deal-file-utils";

type FilePreviewDialogProps = {
  dealId: string;
  file: FileIdentity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FilePreviewDialog({
  dealId,
  file,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden p-0 sm:p-0">
        {file ? (
          <>
            <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <DialogTitle className="truncate text-sm font-medium">
                  {file.name}
                </DialogTitle>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatFileSize(file.size ?? 0)}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                asChild
                aria-label={`Download ${file.name}`}
              >
                <a
                  href={fileProxyUrl(dealId, file, "download")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" />
                </a>
              </Button>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden bg-muted/20 p-5">
              <div className="h-full overflow-y-auto">
                <FilePreview dealId={dealId} file={file} variant="full" />
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

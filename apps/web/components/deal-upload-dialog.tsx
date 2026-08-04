"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FolderUp,
  Files,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Upload,
  HardDrive,
} from "lucide-react";
import { formatFileSize, UPLOAD_LIMITS } from "./deal-file-utils";

type UploadItem = {
  key: string;
  file: File;
  relPath: string;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  storedName?: string;
};

type DealUploadDialogProps = {
  dealId: string;
  currentFolder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
};

const CONCURRENCY = 3;

type WebkitFileEntry = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  name: string;
  file: (
    cb: (f: File) => void,
    err?: () => void,
  ) => void;
  createReader: () => {
    readEntries: (
      cb: (entries: WebkitFileEntry[]) => void,
      err?: () => void,
    ) => void;
  };
};

type QueuedSource = { file: File; baseRel: string };

function entryToFile(entry: WebkitFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, () => reject(new Error("Could not read file")));
  });
}

async function readAllEntries(
  reader: ReturnType<WebkitFileEntry["createReader"]>,
): Promise<WebkitFileEntry[]> {
  const all: WebkitFileEntry[] = [];
  for (;;) {
    const batch = await new Promise<WebkitFileEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, () => reject(new Error("Could not read folder")));
    });
    if (batch.length === 0) break;
    all.push(...batch);
  }
  return all;
}

async function collectEntry(
  entry: WebkitFileEntry,
  base: string,
  out: QueuedSource[],
): Promise<void> {
  if (entry.isFile) {
    const file = await entryToFile(entry);
    out.push({ file, baseRel: base ? `${base}/${entry.name}` : entry.name });
    return;
  }
  const reader = entry.createReader();
  const children = await readAllEntries(reader);
  const childBase = base ? `${base}/${entry.name}` : entry.name;
  for (const child of children) {
    await collectEntry(child, childBase, out);
  }
}

async function collectDrop(
  items: DataTransferItemList,
): Promise<QueuedSource[]> {
  const out: QueuedSource[] = [];
  const entries: WebkitFileEntry[] = [];
  let hasEntryApi = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const getEntry = item.webkitGetAsEntry as (() => WebkitFileEntry | null) | undefined;
    if (typeof getEntry === "function") {
      hasEntryApi = true;
      const entry = getEntry.call(item);
      if (entry) entries.push(entry);
    }
  }
  if (hasEntryApi && entries.length > 0) {
    for (const entry of entries) {
      await collectEntry(entry, "", out);
    }
    return out;
  }
  // Fallback: flat files only (no folder hierarchy available)
  for (let i = 0; i < items.length; i++) {
    const f = items[i].getAsFile();
    if (f) out.push({ file: f, baseRel: f.name });
  }
  return out;
}

export function DealUploadDialog({
  dealId,
  currentFolder,
  open,
  onOpenChange,
  onComplete,
}: DealUploadDialogProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [phase, setPhase] = useState<"select" | "uploading">("select");
  const [doneCount, setDoneCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const statsRef = useRef({ ok: 0, failed: 0 });
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setItems([]);
    setPhase("select");
    setDoneCount(0);
    abortRef.current = null;
    statsRef.current = { ok: 0, failed: 0 };
  };

  const close = (): void => {
    abortRef.current?.abort();
    reset();
    onOpenChange(false);
  };

  const fullRelPath = (relPath: string): string =>
    currentFolder ? `${currentFolder}/${relPath}` : relPath;

  const queueFiles = (incoming: QueuedSource[]) => {
    const incomingItems: UploadItem[] = [];
    const errors: string[] = [];
    let totalBytes = items.reduce((sum, i) => sum + i.file.size, 0);

    for (const { file, baseRel } of incoming) {
      const rel = fullRelPath(baseRel);

      if (rel.split("/").length > UPLOAD_LIMITS.maxDepth) {
        errors.push(`${file.name}: folder nesting is too deep`);
        continue;
      }
      if (file.size > UPLOAD_LIMITS.maxFileBytes) {
        errors.push(`${file.name}: exceeds the 50MB per-file limit`);
        continue;
      }
      if (incomingItems.length + items.length >= UPLOAD_LIMITS.maxFilesPerBatch) {
        errors.push(
          `Maximum ${UPLOAD_LIMITS.maxFilesPerBatch} files per upload reached`,
        );
        break;
      }
      totalBytes += file.size;
      if (totalBytes > UPLOAD_LIMITS.maxTotalBytes) {
        errors.push("Total upload size exceeds the 250MB batch limit");
        break;
      }

      incomingItems.push({
        key: `${rel}-${file.lastModified}-${file.size}`,
        file,
        relPath: rel,
        status: "queued",
      });
    }

    if (errors.length > 0) {
      toast.error(errors.slice(0, 3).join(" · "));
    }
    if (incomingItems.length > 0) {
      setItems((prev) => [...prev, ...incomingItems]);
      setPhase("select");
    }
  };

  const addFiles = (incoming: File[], isFolder: boolean) => {
    queueFiles(
      incoming.map((f) => ({
        file: f,
        baseRel: isFolder
          ? (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
            f.name
          : f.name,
      })),
    );
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const collected = await collectDrop(e.dataTransfer.items);
      queueFiles(collected);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      queueFiles(
        Array.from(e.dataTransfer.files).map((f) => ({
          file: f,
          baseRel: f.name,
        })),
      );
    }
  };

  const bytesTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.file.size, 0),
    [items],
  );
  const bytesDone = useMemo(
    () =>
      items
        .filter((i) => i.status === "done")
        .reduce((sum, i) => sum + i.file.size, 0),
    [items],
  );
  const progress =
    bytesTotal > 0 ? Math.round((bytesDone / bytesTotal) * 100) : 0;

  const uploadOne = async (item: UploadItem): Promise<void> => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === item.key ? { ...i, status: "uploading", error: undefined } : i,
      ),
    );
    try {
      const res = await fetch(`/api/deals/${dealId}/files`, {
        method: "POST",
        headers: {
          "X-File-Path": encodeURIComponent(item.relPath),
          "X-File-Type": item.file.type || "application/octet-stream",
        },
        body: item.file,
        signal: abortRef.current?.signal,
      });
      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      const data = (await res.json()) as { name: string };
      setItems((prev) =>
        prev.map((i) =>
          i.key === item.key
            ? { ...i, status: "done", storedName: data.name }
            : i,
        ),
      );
      setDoneCount((c) => c + 1);
      statsRef.current.ok += 1;
    } catch (error) {
      if (abortRef.current?.signal.aborted) return;
      statsRef.current.failed += 1;
      setItems((prev) =>
        prev.map((i) =>
          i.key === item.key
            ? {
                ...i,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : i,
        ),
      );
    }
  };

  const uploadAll = async (): Promise<void> => {
    const targets = items.filter((i) => i.status !== "done");
    if (targets.length === 0) return;
    setPhase("uploading");
    setDoneCount(0);
    statsRef.current = { ok: 0, failed: 0 };
    abortRef.current = new AbortController();
    const inFlight = new Set<Promise<void>>();
    let index = 0;

    await new Promise<void>((resolve) => {
      const start = () => {
        while (inFlight.size < CONCURRENCY && index < targets.length) {
          const p = uploadOne(targets[index]).finally(() => {
            inFlight.delete(p);
            start();
          });
          inFlight.add(p);
          index += 1;
        }
        if (index >= targets.length && inFlight.size === 0) resolve();
      };
      start();
    });

    const { ok, failed } = statsRef.current;
    if (failed > 0) {
      toast.warning(`Uploaded ${ok} of ${ok + failed} files`);
    } else if (ok > 0) {
      toast.success(`Uploaded ${ok} ${ok === 1 ? "file" : "files"}`);
    }
    onComplete();
    close();
  };

  const retryFailed = (): void => {
    setItems((prev) =>
      prev.map((i) => (i.status === "error" ? { ...i, status: "queued" } : i)),
    );
    setPhase("select");
  };

  const removeItem = (key: string): void => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const pendingCount = items.filter((i) => i.status !== "done").length;
  const uploading = phase === "uploading";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            {currentFolder ? (
              <>
                Uploading into{" "}
                <span className="font-mono text-xs text-foreground">
                  {currentFolder}/
                </span>
              </>
            ) : (
              "Upload into the top level of this deal's folder"
            )}
            . Files are uploaded as-is; sub-folders keep their structure. Max{" "}
            {formatFileSize(UPLOAD_LIMITS.maxFileBytes)} per file.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto rounded-lg transition-colors",
            dragActive &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={(e) => void handleDrop(e)}
        >
          {/* Drop hint */}
          {dragActive && !uploading ? (
            <div className="pointer-events-none sticky top-0 z-10 flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
              <Upload className="size-4" />
              Drop files or folders to add them
            </div>
          ) : null}

          {/* Pickers */}
          {!uploading && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <input
                ref={filesInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    addFiles(Array.from(e.target.files), false);
                  }
                  e.target.value = "";
                }}
              />
              <input
                ref={(el) => {
                  folderInputRef.current = el;
                  if (el) {
                    el.setAttribute("webkitdirectory", "");
                    el.setAttribute("directory", "");
                  }
                }}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    addFiles(Array.from(e.target.files), true);
                  }
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => filesInputRef.current?.click()}
              >
                <Files className="size-5" />
                Choose files
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderUp className="size-5" />
                Choose folder
              </Button>
            </div>
          )}

          {/* Progress */}
          {uploading && items.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {doneCount} of {items.length} files
                </span>
                <span className="font-mono tabular-nums">
                  {formatFileSize(bytesDone)} / {formatFileSize(bytesTotal)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Queue */}
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No files selected yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      item.status === "done" &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      item.status === "error" &&
                        "bg-destructive/10 text-destructive",
                      (item.status === "queued" ||
                        item.status === "uploading") &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.status === "done" ? (
                      <CheckCircle2 className="size-4" />
                    ) : item.status === "error" ? (
                      <XCircle className="size-4" />
                    ) : item.status === "uploading" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <HardDrive className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.storedName ?? item.file.name}
                      {item.storedName && item.storedName !== item.file.name ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          renamed to avoid conflict
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {item.relPath}
                    </p>
                    {item.error ? (
                      <p className="truncate text-xs text-destructive">
                        {item.error}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </span>
                  {!uploading ? (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          {!uploading ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setItems([]);
                  setPhase("select");
                }}
                disabled={items.length === 0}
              >
                Clear
              </Button>
              {pendingCount > 0 && items.some((i) => i.status === "error") ? (
                <Button variant="outline" onClick={retryFailed}>
                  Retry failed ({items.filter((i) => i.status === "error").length})
                </Button>
              ) : null}
              <Button
                onClick={() => void uploadAll()}
                disabled={pendingCount === 0}
              >
                <Upload className="mr-1.5 size-4" />
                Upload {pendingCount} {pendingCount === 1 ? "file" : "files"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                abortRef.current?.abort();
                setPhase("select");
              }}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

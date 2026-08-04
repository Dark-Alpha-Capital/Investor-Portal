"use client";

import { useCallback, useMemo, useState } from "react";
import type { DealEntry } from "@repo/nextcloud";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Upload,
  Loader2,
  Download,
  FolderOpen,
  Folder as FolderIcon,
  LayoutGrid,
  List,
  Eye,
  Check,
  X,
  Trash2,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  Film,
  FileAudio,
  File as FileIcon,
  Image as ImageIcon,
} from "lucide-react";
import { FilePreview } from "./deal-file-preview";
import { FilePreviewDialog } from "./deal-file-preview-dialog";
import { DealUploadDialog } from "./deal-upload-dialog";
import {
  fileProxyUrl,
  formatFileDate,
  formatFileSize,
} from "./deal-file-utils";

type DealFilesTabProps = {
  dealId: string;
  entries: DealEntry[];
};

let jszipPromise: Promise<{ default: typeof import("jszip") }> | null = null;

function loadJszip() {
  if (!jszipPromise) jszipPromise = import("jszip");
  return jszipPromise;
}

function FileTypeTile({ mimeType }: { mimeType: string }) {
  let icon = FileIcon;
  let tint = "bg-muted text-muted-foreground";
  if (mimeType.startsWith("image/")) {
    icon = ImageIcon;
    tint = "bg-sky-500/10 text-sky-700 dark:text-sky-400";
  } else if (mimeType === "application/pdf") {
    icon = FileText;
    tint = "bg-rose-500/10 text-rose-700 dark:text-rose-400";
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    icon = FileText;
    tint = "bg-sky-500/10 text-sky-700 dark:text-sky-400";
  } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    icon = FileSpreadsheet;
    tint = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  } else if (
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation")
  ) {
    icon = Presentation;
    tint = "bg-orange-500/10 text-orange-700 dark:text-orange-400";
  } else if (mimeType.startsWith("video/")) {
    icon = Film;
    tint = "bg-violet-500/10 text-violet-700 dark:text-violet-400";
  } else if (mimeType.startsWith("audio/")) {
    icon = FileAudio;
    tint = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
    icon = FileArchive;
    tint = "bg-slate-500/10 text-slate-700 dark:text-slate-400";
  }
  const Icon = icon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border border-border",
        tint,
      )}
      role="img"
      aria-label="file type"
    >
      <Icon className="size-4" />
    </span>
  );
}

export function DealFilesTab({ dealId, entries }: DealFilesTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("list");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<DealEntry | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const isRoot = currentPath === "";
  const rootFolders = useMemo(
    () => entries.filter((e) => e.kind === "folder"),
    [entries],
  );
  const rootFiles = useMemo(
    () => entries.filter((e) => e.kind === "file"),
    [entries],
  );

  const folderQuery = useQuery({
    ...trpc.deals.listFolder.queryOptions({
      dealId,
      relativePath: isRoot ? undefined : currentPath,
    }),
    initialData: isRoot
      ? { folders: rootFolders, files: rootFiles }
      : undefined,
  });

  const folders = useMemo(
    () => folderQuery.data?.folders ?? [],
    [folderQuery.data],
  );
  const files = useMemo(
    () => folderQuery.data?.files ?? [],
    [folderQuery.data],
  );
  const isLoading = !isRoot && folderQuery.isFetching;

  const currentEntries = useMemo(
    () => [...folders, ...files],
    [folders, files],
  );
  const selectedEntries = currentEntries.filter((e) =>
    selectedPaths.has(e.path),
  );
  const allSelected =
    currentEntries.length > 0 &&
    currentEntries.every((e) => selectedPaths.has(e.path));

  const navigateTo = useCallback((rel: string) => {
    setCurrentPath(rel);
    setSelectedPaths(new Set());
    setPreviewFile(null);
  }, []);

  const openFolder = useCallback(
    (entry: DealEntry) => navigateTo(entry.relativePath),
    [navigateTo],
  );

  const toggleSelect = useCallback((entry: DealEntry) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(entry.path)) {
        next.delete(entry.path);
      } else {
        next.add(entry.path);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedPaths((prev) => {
      if (prev.size > 0 && currentEntries.every((e) => prev.has(e.path))) {
        return new Set();
      }
      return new Set(currentEntries.map((e) => e.path));
    });
  }, [currentEntries]);

  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  const triggerSingleDownload = useCallback(
    (entry: DealEntry) => {
      if (entry.kind !== "file" || !entry.downloadUrl) return;
      const a = document.createElement("a");
      a.href = fileProxyUrl(dealId, entry, "download");
      a.download = entry.name;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    [dealId],
  );

  const collectFilesForDownload = useCallback(
    async (entriesToCollect: DealEntry[]) => {
      const out: { entry: DealEntry; zipPath: string }[] = [];
      for (const e of entriesToCollect) {
        if (e.kind === "file") {
          out.push({ entry: e, zipPath: e.relativePath || e.name });
        } else {
          const sub = await queryClient.fetchQuery(
            trpc.deals.listFolder.queryOptions({
              dealId,
              relativePath: e.relativePath,
            }),
          );
          const deeper = await collectFilesForDownload([
            ...sub.folders,
            ...sub.files,
          ]);
          out.push(...deeper);
        }
      }
      return out;
    },
    [dealId, trpc, queryClient],
  );

  const handleDownloadSelected = useCallback(async () => {
    const selected = selectedEntries;
    if (selected.length === 0) return;
    setIsDownloading(true);
    try {
      const flat = await collectFilesForDownload(selected);
      if (flat.length === 0) {
        toast.error("Nothing to download");
        return;
      }
      if (flat.length === 1) {
        triggerSingleDownload(flat[0].entry);
        return;
      }
      const mod = await loadJszip();
      const JSZip = mod.default;
      const zip = new JSZip();
      let failed = 0;
      await Promise.all(
        flat.map(async ({ entry, zipPath }) => {
          try {
            const res = await fetch(fileProxyUrl(dealId, entry, "download"));
            if (!res.ok) throw new Error("fetch failed");
            const buf = await res.arrayBuffer();
            zip.file(zipPath, buf);
          } catch {
            failed += 1;
          }
        }),
      );
      if (failed === flat.length) {
        toast.error("Couldn't download any of the selected files");
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "deal-files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (failed > 0) {
        toast.warning(`Downloaded ${flat.length - failed} of ${flat.length} files`);
      } else {
        toast.success(`Downloaded ${flat.length} files`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download");
    } finally {
      setIsDownloading(false);
    }
  }, [selectedEntries, dealId, triggerSingleDownload, collectFilesForDownload]);

  const deleteFileMutation = useMutation(
    trpc.deals.deleteFile.mutationOptions(),
  );

  const handleDeleteSelected = useCallback(async () => {
    const selected = selectedEntries;
    if (selected.length === 0) return;
    setIsDeleting(true);
    let failed = 0;
    for (const e of selected) {
      try {
        await deleteFileMutation.mutateAsync({ dealId, path: e.path });
      } catch {
        failed += 1;
      }
    }
    setIsDeleting(false);
    setDeleteOpen(false);
    clearSelection();
    await folderQuery.refetch();
    void queryClient.invalidateQueries({
      queryKey: trpc.deals.listFolder.queryKey({ dealId }),
    });
    if (failed > 0) {
      toast.warning(`Deleted ${selected.length - failed} of ${selected.length} items`);
    } else {
      toast.success(
        `Deleted ${selected.length} ${selected.length === 1 ? "item" : "items"}`,
      );
    }
  }, [
    selectedEntries,
    dealId,
    deleteFileMutation,
    clearSelection,
    folderQuery,
    queryClient,
    trpc,
  ]);

  const handleRefresh = useCallback(() => {
    void folderQuery.refetch();
  }, [folderQuery]);

  const breadcrumb = currentPath ? currentPath.split("/") : [];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-12 items-center">
          {selectedEntries.length > 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold tracking-tight">
                {selectedEntries.length} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                Deal files
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isLoading
                  ? "Loading…"
                  : `${folders.length + files.length} ${
                      folders.length + files.length === 1 ? "item" : "items"
                    } in this folder`}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedEntries.length > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadSelected()}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 size-4" />
                )}
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 size-4" />
                Delete
              </Button>
            </>
          ) : null}

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(value) => {
              if (value === "grid" || value === "list") setView(value);
            }}
          >
            <ToggleGroupItem
              value="grid"
              aria-label="Grid view"
              className="px-2.5"
            >
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="px-2.5"
            >
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => navigateTo("")}
          className={cn(
            "rounded px-1.5 py-0.5 font-medium transition-colors hover:bg-accent hover:text-foreground",
            isRoot ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Deal files
        </button>
        {breadcrumb.map((segment, i) => {
          const path = breadcrumb.slice(0, i + 1).join("/");
          const isLast = i === breadcrumb.length - 1;
          return (
            <span key={path} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => navigateTo(path)}
                className={cn(
                  "max-w-[16rem] truncate rounded px-1.5 py-0.5 font-medium transition-colors hover:bg-accent hover:text-foreground",
                  isLast ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {segment}
              </button>
            </span>
          );
        })}
      </nav>

      {currentEntries.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
            <FolderOpen className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              This folder is empty
            </p>
            <p className="text-sm text-muted-foreground">
              Upload files or a whole folder to get started.
            </p>
          </div>
        </div>
      ) : isLoading && currentEntries.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {folders.map((folder) => (
            <FolderGridCard
              key={folder.path}
              entry={folder}
              isSelected={selectedPaths.has(folder.path)}
              onToggle={() => toggleSelect(folder)}
              onOpen={() => openFolder(folder)}
            />
          ))}
          {files.map((file) => (
            <FileGridCard
              key={file.path}
              entry={file}
              dealId={dealId}
              isSelected={selectedPaths.has(file.path)}
              onToggle={() => toggleSelect(file)}
              onView={() => setPreviewFile(file)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleSelectAll()}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Last modified
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map((folder) => (
                <FolderRow
                  key={folder.path}
                  entry={folder}
                  isSelected={selectedPaths.has(folder.path)}
                  onToggle={() => toggleSelect(folder)}
                  onOpen={() => openFolder(folder)}
                />
              ))}
              {files.map((file) => (
                <FileRow
                  key={file.path}
                  entry={file}
                  dealId={dealId}
                  isSelected={selectedPaths.has(file.path)}
                  onToggle={() => toggleSelect(file)}
                  onView={() => setPreviewFile(file)}
                  onDownload={() => triggerSingleDownload(file)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DealUploadDialog
        dealId={dealId}
        currentFolder={currentPath}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onComplete={handleRefresh}
      />

      <FilePreviewDialog
        dealId={dealId}
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedEntries.length}{" "}
              {selectedEntries.length === 1 ? "item" : "items"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting a folder also deletes everything inside it. This can't
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteSelected();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FolderGridCard({
  entry,
  isSelected,
  onToggle,
  onOpen,
}: {
  entry: DealEntry;
  isSelected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen();
        }
        if (e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-t-lg bg-muted/40">
        <span className="flex size-14 items-center justify-center rounded-xl border border-border bg-background text-amber-500 shadow-sm dark:text-amber-400">
          <FolderIcon className="size-8" />
        </span>

        <span
          className={cn(
            "absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background/80",
          )}
        >
          {isSelected ? <Check className="size-3" /> : null}
        </span>

        <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex size-8 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
            aria-label={`Open ${entry.name}`}
          >
            <FolderOpen className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 border-t border-border px-3 py-2.5">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.name}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Folder</p>
      </div>
    </div>
  );
}

function FileGridCard({
  entry,
  dealId,
  isSelected,
  onToggle,
  onView,
}: {
  entry: DealEntry;
  dealId: string;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-t-lg bg-muted/40 p-2">
        <FilePreview dealId={dealId} file={entry} variant="thumb" />

        <span
          className={cn(
            "absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background/80",
          )}
        >
          {isSelected ? <Check className="size-3" /> : null}
        </span>

        <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex size-8 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
            aria-label={`View ${entry.name}`}
          >
            <Eye className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 border-t border-border px-3 py-2.5">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.name}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {formatFileSize(entry.size)}
        </p>
      </div>
    </div>
  );
}

function FolderRow({
  entry,
  isSelected,
  onToggle,
  onOpen,
}: {
  entry: DealEntry;
  isSelected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <TableRow
      onClick={onToggle}
      onDoubleClick={onOpen}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/40",
        isSelected && "bg-primary/5",
      )}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          aria-label={`Select ${entry.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FolderIcon className="size-4" />
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {entry.name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        —
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
        {formatFileDate(entry.lastModified)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={`Open ${entry.name}`}
        >
          <FolderOpen className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FileRow({
  entry,
  dealId,
  isSelected,
  onToggle,
  onView,
  onDownload,
}: {
  entry: DealEntry;
  dealId: string;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
  onDownload: () => void;
}) {
  return (
    <TableRow
      onClick={onToggle}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/40",
        isSelected && "bg-primary/5",
      )}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          aria-label={`Select ${entry.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <FileTypeTile mimeType={entry.mimeType} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {entry.name}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {entry.mimeType}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm tabular-nums">
        {formatFileSize(entry.size)}
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
        {formatFileDate(entry.lastModified)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            aria-label={`View ${entry.name}`}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            aria-label={`Download ${entry.name}`}
          >
            <Download className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Download, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fileProxyUrl,
  previewKind,
  type FileIdentity,
  type FilePreviewKind,
} from "./deal-file-utils";

// Lazy, client-only loaders. These packages are stubbed out of the SSR
// bundle (lib/ssr-stubs/vite-plugin.ts), so they must only ever be imported
// from here at runtime in the browser.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
let mammothPromise: Promise<typeof import("mammoth")> | null = null;
let xlsxPromise: Promise<typeof import("xlsx")> | null = null;

const docxCache = new Map<string, string>();
const xlsxCache = new Map<string, string>();

function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return mod;
    });
  }
  return pdfjsPromise;
}

function loadMammoth(): Promise<typeof import("mammoth")> {
  if (!mammothPromise) mammothPromise = import("mammoth");
  return mammothPromise;
}

function loadXlsx(): Promise<typeof import("xlsx")> {
  if (!xlsxPromise) xlsxPromise = import("xlsx");
  return xlsxPromise;
}

async function fetchBytes(dealId: string, file: FileIdentity): Promise<ArrayBuffer> {
  const res = await fetch(fileProxyUrl(dealId, file));
  if (!res.ok) {
    throw new Error(`Failed to load file (${res.status})`);
  }
  return res.arrayBuffer();
}

function LoadingPreview({ label = "Loading preview…" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-24 w-full items-center justify-center gap-2 text-xs text-muted-foreground">
      <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      {label}
    </div>
  );
}

function PreviewUnavailable({
  file,
  dealId,
  reason = "Preview isn't available for this file type.",
}: {
  file: FileIdentity;
  dealId: string;
  reason?: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <FileQuestion className="size-8 text-muted-foreground/70" />
      <p className="text-xs text-muted-foreground">{reason}</p>
      <a
        href={fileProxyUrl(dealId, file, "download")}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      >
        <Download className="size-3.5" />
        Download file
      </a>
    </div>
  );
}

function ImagePreview({
  dealId,
  file,
  variant,
}: {
  dealId: string;
  file: FileIdentity;
  variant: "thumb" | "full";
}) {
  return (
    <img
      src={fileProxyUrl(dealId, file)}
      alt={file.name}
      className={cn(
        "object-contain",
        variant === "thumb"
          ? "h-full w-full"
          : "max-h-[75vh] w-full rounded-lg",
      )}
    />
  );
}

function TextPreview({
  dealId,
  file,
  variant,
}: {
  dealId: string;
  file: FileIdentity;
  variant: "thumb" | "full";
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(fileProxyUrl(dealId, file));
        if (!res.ok) throw new Error("fetch failed");
        const value = await res.text();
        if (!cancelled) setText(value);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId, file]);

  if (error) {
    return <PreviewUnavailable file={file} dealId={dealId} />;
  }
  if (text === null) return <LoadingPreview />;

  return (
    <pre
      className={cn(
        "w-full whitespace-pre-wrap break-words rounded-md bg-muted/40 font-mono text-xs leading-relaxed text-foreground",
        variant === "thumb"
          ? "line-clamp-8 h-full overflow-hidden p-3"
          : "max-h-[70vh] overflow-auto p-4",
      )}
    >
      {text}
    </pre>
  );
}

function DocxPreview({
  dealId,
  file,
  variant,
}: {
  dealId: string;
  file: FileIdentity;
  variant: "thumb" | "full";
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = docxCache.get(file.path);
        if (cached) {
          if (!cancelled) setHtml(cached);
          return;
        }
        const buf = await fetchBytes(dealId, file);
        const mammoth = await loadMammoth();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        docxCache.set(file.path, result.value);
        if (!cancelled) setHtml(result.value);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId, file]);

  if (error) {
    return <PreviewUnavailable file={file} dealId={dealId} />;
  }
  if (html === null) return <LoadingPreview label="Rendering document…" />;

  return (
    <div
      className={cn(
        "docx-preview w-full prose-sm prose max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight",
        variant === "thumb"
          ? "pointer-events-none h-full max-h-full overflow-hidden"
          : "max-h-[70vh] overflow-auto",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function XlsxPreview({
  dealId,
  file,
  variant,
}: {
  dealId: string;
  file: FileIdentity;
  variant: "thumb" | "full";
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = xlsxCache.get(file.path);
        if (cached) {
          if (!cancelled) setHtml(cached);
          return;
        }
        const buf = await fetchBytes(dealId, file);
        const XLSX = await loadXlsx();
        const workbook = XLSX.read(buf, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const fullHtml = XLSX.utils.sheet_to_html(sheet);
        const table = fullHtml.match(/<table[\s\S]*<\/table>/i)?.[0] ?? "";
        xlsxCache.set(file.path, table);
        if (!cancelled) setHtml(table);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId, file]);

  if (error) {
    return <PreviewUnavailable file={file} dealId={dealId} />;
  }
  if (html === null) return <LoadingPreview label="Rendering spreadsheet…" />;

  return (
    <div
      className={cn(
        "xlsx-preview w-full overflow-x-auto",
        variant === "thumb" ? "pointer-events-none overflow-hidden" : "",
      )}
    >
      <div
        className={cn(
          "w-max min-w-full text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-left",
          variant === "full" && "max-h-[70vh] overflow-auto",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function PdfPreview({
  dealId,
  file,
  variant,
}: {
  dealId: string;
  file: FileIdentity;
  variant: "thumb" | "full";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const task = pdfjs.getDocument({
          url: fileProxyUrl(dealId, file),
        });
        const loaded = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const page = await loaded.getPage(1);
        const base = page.getViewport({ scale: 1 });

        if (variant === "thumb") {
          const scale = Math.max(0.25, Math.min(1, 320 / base.width));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "mx-auto h-auto max-h-full w-auto";
          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;
          container.appendChild(canvas);
        } else {
          for (let i = 1; i <= loaded.numPages; i++) {
            const p = await loaded.getPage(i);
            const viewport = p.getViewport({ scale: 1.4 });
            const canvas = document.createElement("canvas");
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.className = "mx-auto mb-4 w-auto max-w-full rounded-md border border-border bg-white shadow-sm";
            await p.render({
              canvas,
              canvasContext: canvas.getContext("2d")!,
              viewport,
            }).promise;
            container.appendChild(canvas);
          }
        }
        void task.destroy();
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dealId, file, variant]);

  if (error) {
    return <PreviewUnavailable file={file} dealId={dealId} />;
  }
  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full",
        variant === "full" ? "max-h-[70vh] overflow-auto" : "max-h-full overflow-hidden",
      )}
    />
  );
}

function MediaPreview({
  dealId,
  file,
  kind,
}: {
  dealId: string;
  file: FileIdentity;
  kind: "video" | "audio";
}) {
  const src = fileProxyUrl(dealId, file);
  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        className="max-h-[70vh] w-full rounded-lg bg-black/5"
      />
    );
  }
  return <audio src={src} controls className="w-full" />;
}

function UnsupportedPreview({ file }: { file: FileIdentity }) {
  return (
    <div className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
        <FileText className="size-5" />
      </span>
      <p className="text-xs text-muted-foreground">
        {file.name}
      </p>
    </div>
  );
}

export type FilePreviewProps = {
  dealId: string;
  file: FileIdentity;
  variant?: "thumb" | "full";
  className?: string;
};

export function FilePreview({
  dealId,
  file,
  variant = "thumb",
  className,
}: FilePreviewProps) {
  const kind: FilePreviewKind = previewKind(file.mimeType, file.name);

  const render = useCallback((): React.ReactNode => {
    switch (kind) {
      case "image":
        return <ImagePreview dealId={dealId} file={file} variant={variant} />;
      case "pdf":
        return <PdfPreview dealId={dealId} file={file} variant={variant} />;
      case "docx":
        return <DocxPreview dealId={dealId} file={file} variant={variant} />;
      case "xlsx":
        return <XlsxPreview dealId={dealId} file={file} variant={variant} />;
      case "text":
      case "csv":
        return <TextPreview dealId={dealId} file={file} variant={variant} />;
      case "video":
        return <MediaPreview dealId={dealId} file={file} kind="video" />;
      case "audio":
        return <MediaPreview dealId={dealId} file={file} kind="audio" />;
      case "pptx":
      case "other":
      default:
        return variant === "thumb" ? (
          <UnsupportedPreview file={file} />
        ) : (
          <PreviewUnavailable
            file={file}
            dealId={dealId}
            reason="This file type can't be previewed in the browser."
          />
        );
    }
  }, [kind, dealId, file, variant]);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        className,
      )}
    >
      {render()}
    </div>
  );
}

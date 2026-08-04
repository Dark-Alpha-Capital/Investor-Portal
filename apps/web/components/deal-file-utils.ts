export type FilePreviewKind =
  | "image"
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "text"
  | "csv"
  | "video"
  | "audio"
  | "other";

/** Minimal shape needed to preview/proxy a stored file. */
export type FileIdentity = {
  name: string;
  path: string;
  mimeType: string;
  size?: number;
};

export const UPLOAD_LIMITS = {
  maxFileBytes: 50 * 1024 * 1024, // 50MB per file
  maxFilesPerBatch: 50,
  maxTotalBytes: 250 * 1024 * 1024, // 250MB per batch
  maxDepth: 20,
} as const;

const EXTENSION_KINDS: Record<string, FilePreviewKind> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  xls: "xlsx",
  pptx: "pptx",
  ppt: "pptx",
  csv: "csv",
  txt: "text",
  rtf: "text",
  md: "text",
  json: "text",
  xml: "text",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
  m4v: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  aac: "audio",
  m4a: "audio",
  flac: "audio",
};

function kindFromMime(mimeType: string): FilePreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "xlsx";
  }
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "pptx";
  }
  if (mimeType === "text/plain" || mimeType === "application/rtf") return "text";
  if (mimeType === "text/csv") return "csv";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
}

export function previewKind(mimeType: string, name?: string): FilePreviewKind {
  const fromMime = kindFromMime(mimeType);
  if (fromMime !== "other") return fromMime;
  if (name) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return EXTENSION_KINDS[ext] ?? "other";
  }
  return fromMime;
}

export function fileProxyUrl(
  dealId: string,
  file: { path: string },
  mode: "preview" | "download" = "preview",
): string {
  const params = new URLSearchParams({ path: file.path });
  if (mode === "download") {
    params.set("mode", "download");
  }
  return `/api/deals/${dealId}/file?${params.toString()}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatFileDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

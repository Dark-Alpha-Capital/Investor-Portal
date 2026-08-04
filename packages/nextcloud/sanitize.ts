/** Sanitize upload file names (path traversal, odd chars). */
export function sanitizeUploadFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, "_");
}

/** Match deal folder naming used across the app. */
export function sanitizeDealFolderSegment(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

/**
 * Sanitize a relative file/folder path (segments joined by "/"). Returns the
 * cleaned path, or null if invalid (empty, exceeds maxDepth, or contains a
 * leading slash / traversal segments that survive sanitizing).
 */
export function sanitizeRelativePath(
  relativePath: string,
  maxDepth = 20,
): string | null {
  const segments = relativePath
    .split("/")
    .filter((s) => s.length > 0 && s !== "." && s !== "..");
  if (segments.length === 0) return null;
  if (segments.length > maxDepth) return null;
  const cleaned = segments.map((seg) => sanitizeUploadFileName(seg));
  if (cleaned.some((s) => s.length === 0)) return null;
  return cleaned.join("/");
}

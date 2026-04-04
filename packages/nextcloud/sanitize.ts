/** Sanitize upload file names (path traversal, odd chars). */
export function sanitizeUploadFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, "_");
}

/** Match deal folder naming used across the app. */
export function sanitizeDealFolderSegment(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

import { Buffer } from "node:buffer";
import type { FileStat } from "webdav";
import type { WebDAVClient } from "webdav";
import type { DealFile } from "./types";
import { sanitizeUploadFileName } from "./sanitize";

export async function listFiles(
  client: WebDAVClient,
  folderPath: string,
): Promise<DealFile[]> {
  const contents = await client.getDirectoryContents(folderPath);
  const items = contents as FileStat[];
  return items
    .map((item) => ({
      name: item.basename,
      size: item.size,
      lastModified: item.lastmod,
      mimeType: item.mime ?? "",
      downloadUrl: client.getFileDownloadLink(item.filename),
    }))
    .filter((f) => f.mimeType !== "httpd/unix-directory");
}

export async function fileExists(client: WebDAVClient, path: string): Promise<boolean> {
  return client.exists(path);
}

export async function getFileContents(
  client: WebDAVClient,
  path: string,
): Promise<Uint8Array> {
  const raw = await client.getFileContents(path, { format: "binary" });
  if (raw instanceof ArrayBuffer) {
    return new Uint8Array(raw);
  }
  if (raw instanceof Uint8Array) {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return new Uint8Array(raw);
  }
  throw new Error("Unexpected file contents format from WebDAV");
}

export async function ensureDirectory(
  client: WebDAVClient,
  folderPath: string,
): Promise<void> {
  const exists = await client.exists(folderPath);
  if (!exists) {
    await client.createDirectory(folderPath, { recursive: true });
  }
}

export async function uploadBuffer(
  client: WebDAVClient,
  remotePath: string,
  data: Buffer | Uint8Array,
  options?: { overwrite?: boolean },
): Promise<boolean> {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return client.putFileContents(remotePath, buf, {
    overwrite: options?.overwrite ?? true,
    contentLength: buf.length,
  });
}

export { sanitizeUploadFileName };

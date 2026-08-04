import { Buffer } from "node:buffer";
import type { FileStat } from "webdav";
import type { WebDAVClient } from "webdav";
import type { DealEntry, DealFile } from "./types";
import { getNextcloudConfigFromEnv } from "./client";
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
      path: item.filename,
    }))
    .filter((f) => f.mimeType !== "httpd/unix-directory");
}

/**
 * List a single directory, returning structured folder + file entries.
 * `rootDir` is the deal folder root used to compute `relativePath` values
 * (e.g. "/investor-portal/deals/acme").
 */
export async function listFolder(
  client: WebDAVClient,
  dirPath: string,
  rootDir: string,
): Promise<{ folders: DealEntry[]; files: DealEntry[] }> {
  const contents = (await client.getDirectoryContents(dirPath, {
    details: false,
  })) as FileStat[];
  const folders: DealEntry[] = [];
  const files: DealEntry[] = [];

  for (const item of contents) {
    const isDir =
      item.type === "directory" || item.mime === "httpd/unix-directory";
    const relativePath = relativePathFor(item.filename, rootDir);

    if (isDir) {
      folders.push({
        kind: "folder",
        name: item.basename,
        path: item.filename,
        relativePath,
        size: 0,
        lastModified: item.lastmod ?? "",
        mimeType: "httpd/unix-directory",
        downloadUrl: null,
      });
    } else {
      files.push({
        kind: "file",
        name: item.basename,
        path: item.filename,
        relativePath,
        size: item.size ?? 0,
        lastModified: item.lastmod ?? "",
        mimeType: item.mime ?? "",
        downloadUrl: client.getFileDownloadLink(item.filename),
      });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, files };
}

function httpStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

/**
 * Retry an operation a few times when Nextcloud reports a transient conflict
 * (409) or lock (423) — e.g. concurrent uploads racing to create the same
 * directory. Other statuses fail immediately.
 */
async function withRetries<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delayMs?: number },
): Promise<T> {
  const retries = options?.retries ?? 4;
  const delayMs = options?.delayMs ?? 250;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = httpStatus(error);
      lastError = error;
      if ((status === 409 || status === 423) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function deleteFile(
  client: WebDAVClient,
  path: string,
): Promise<void> {
  await client.deleteFile(path);
}

export async function fileExists(
  client: WebDAVClient,
  path: string,
): Promise<boolean> {
  return withRetries(() => client.exists(path));
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
  // webdav's exists()/PROPFIND returns 404 for existing collections (missing
  // trailing slash quirk on Nextcloud), so existence checks are unreliable.
  // Build the chain level-by-level with MKCOL, treating "already exists"
  // (405) and "exists but locked" (423) as success at each level, and retrying
  // transient 409 conflicts from concurrent uploads creating the same folder.
  // This also avoids webdav's recursive createDirectory short-circuiting.
  const segments = folderPath.split("/").filter((s) => s.length > 0);
  let current = "";
  for (const segment of segments) {
    current = `${current}/${segment}`;
    try {
      await withRetries(() =>
        client.createDirectory(current, { recursive: false }),
      );
    } catch (error) {
      const status = httpStatus(error);
      if (status === 405 || status === 409 || status === 423) {
        continue;
      }
      throw error;
    }
  }
}

/**
 * Ensure a set of directories exist, creating parents recursively as needed.
 * Callers typically pass the unique parent dirs for a batch of uploads.
 */
export async function ensureDirectoryTree(
  client: WebDAVClient,
  dirPaths: string[],
): Promise<void> {
  const unique = [...new Set(dirPaths.filter((p) => p && p !== "/"))];
  for (const dir of unique) {
    await ensureDirectory(client, dir);
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

/**
 * PUT a file into Nextcloud and return the final stored path.
 *
 * NOTE: this bypasses `client.putFileContents` on purpose — webdav's request
 * layer hands Node streams to fetch(), which Workers doesn't accept as a body
 * (the upload silently sends zero bytes). The body is passed as bytes so the
 * PUT can be retried on transient 409/423 conflicts (concurrent uploads racing
 * to create folders), and the correct Content-Type is sent so Nextcloud stores
 * the right MIME for previews.
 */
export async function uploadFileStream(
  remotePath: string,
  body: Uint8Array | Buffer,
  size: number,
  options?: { overwrite?: boolean; contentType?: string },
): Promise<boolean> {
  const config = getNextcloudConfigFromEnv();
  const baseUrl = `${config.url.replace(/\/$/, "")}/remote.php/dav/files/${config.user}`;
  const encodedPath = remotePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const data = Buffer.isBuffer(body) ? body : Buffer.from(body);

  const doPut = async (): Promise<Response> => {
    const res = await fetch(`${baseUrl}${encodedPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.user}:${config.password}`).toString("base64")}`,
        "Content-Type": options?.contentType ?? "application/octet-stream",
        "Content-Length": String(size),
        ...(options?.overwrite === false ? { "If-None-Match": "*" } : {}),
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) {
      throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    }
    return res;
  };

  try {
    await withRetries(doPut);
  } catch (error) {
    const status = httpStatus(error);
    if (options?.overwrite === false && status === 412) {
      return false;
    }
    if (status === 409) {
      throw Object.assign(
        new Error(
          "Nextcloud reported a conflict while writing this file. Please retry.",
        ),
        { status },
      );
    }
    let message = `Upload to Nextcloud failed (${status ?? "unknown"})`;
    if (status === 423) {
      message =
        "The destination folder is locked in Nextcloud (someone has it open). Release the lock and try again.";
    } else if (status === 507) {
      message = "Insufficient storage space on Nextcloud.";
    }
    throw Object.assign(new Error(message), { status });
  }
  return true;
}

/**
 * Find a non-colliding path for `fileName` inside `dirPath`, auto-renaming to
 * "name (1).ext", "name (2).ext", ... when the name already exists.
 */
export async function resolveUniqueFilePath(
  client: WebDAVClient,
  dirPath: string,
  fileName: string,
): Promise<string> {
  const base = dirPath.replace(/\/+$/, "");
  let candidate = `${base}/${fileName}`;
  if (!(await fileExists(client, candidate))) {
    return candidate;
  }
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot) : "";
  let i = 1;
  for (;;) {
    candidate = `${base}/${stem} (${i})${ext}`;
    if (!(await fileExists(client, candidate))) {
      return candidate;
    }
    i += 1;
  }
}

export { sanitizeUploadFileName };

function relativePathFor(itemPath: string, rootDir: string): string {
  const prefix = rootDir.replace(/\/+$/, "") + "/";
  if (itemPath.startsWith(prefix)) {
    return itemPath.slice(prefix.length);
  }
  return itemPath.replace(/^\/+/, "");
}

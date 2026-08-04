import slugify from "slugify";
import type { WebDAVClient } from "webdav";
import {
  createNextcloudClientFromEnv,
  dealFolderPath,
  deleteFile as deleteNextcloudFile,
  fileExists,
  getFileContents,
  listFolder,
  ensureDirectoryTree,
  resolveUniqueFilePath,
  sanitizeRelativePath,
  uploadFileStream,
  type DealEntry,
  type DealFile,
} from "@repo/nextcloud";

export type { DealEntry, DealFile };

export type DealFileUploadResult = {
  path: string;
  name: string;
  size: number;
};

export type DealFileDownloadResult = {
  contents: Uint8Array;
  mimeType: string;
  fileName: string;
};

export interface DealFileStore {
  /** List a deal folder (root or a subdirectory via `relativePath`). */
  listFolder(
    dealId: string,
    relativePath?: string,
  ): Promise<{ folders: DealEntry[]; files: DealEntry[] }>;
  /** Delete a file by its full remote path. */
  delete(dealId: string, path: string): Promise<void>;
  /** Stream-upload a file into the deal's folder. */
  upload(
    dealId: string,
    args: {
      relativePath: string;
      body: Uint8Array;
      length: number;
      contentType: string;
    },
  ): Promise<DealFileUploadResult>;
  /** Download a file by its full remote path. */
  download(dealId: string, path: string): Promise<DealFileDownloadResult>;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Resolve the canonical Nextcloud folder for a deal. Single source of truth for
 * the deal-folder path formula (was copy-pasted in ~7 places).
 */
async function resolveDealFolderPath(dealId: string): Promise<string | null> {
  const { getDealById } = await import("@repo/db/queries");
  const dealRecord = await getDealById(dealId);
  if (!dealRecord) {
    return null;
  }
  const dealSlug =
    dealRecord.slug || slugify(dealRecord.name, { lower: true, strict: true });
  return dealFolderPath(dealSlug);
}

export function createDealFileStore(
  deps?: {
    client?: WebDAVClient;
    getDealFolderPath?: (dealId: string) => Promise<string | null>;
    /** Low-level byte PUT. Defaults to the Workers-safe streaming upload. */
    putFile?: (args: {
      finalPath: string;
      body: Uint8Array;
      length: number;
      contentType: string;
    }) => Promise<boolean>;
  },
): DealFileStore {
  const client = deps?.client ?? createNextcloudClientFromEnv();
  const resolvePath = deps?.getDealFolderPath ?? resolveDealFolderPath;
  const putFile =
    deps?.putFile ??
    (({ finalPath, body, length, contentType }) =>
      uploadFileStream(finalPath, body, length, { contentType }));

  return {
    async listFolder(dealId, relativePath) {
      const folderPath = await resolvePath(dealId);
      if (!folderPath) {
        return { folders: [], files: [] };
      }

      let rel: string | null = null;
      if (relativePath) {
        rel = sanitizeRelativePath(relativePath);
        if (!rel) {
          throw new Error("Invalid folder path");
        }
      }
      const dirPath = rel ? `${folderPath}/${rel}` : folderPath;

      const exists = await fileExists(client, dirPath);
      if (!exists) {
        return { folders: [], files: [] };
      }
      return listFolder(client, dirPath, folderPath);
    },

    async delete(dealId, path) {
      const folderPath = await resolvePath(dealId);
      if (!folderPath) {
        throw new Error("Deal not found");
      }
      // Only allow paths inside this deal's folder.
      if (!path.startsWith(`${folderPath}/`) || path.includes("..")) {
        throw new Error("Invalid file path");
      }
      await deleteNextcloudFile(client, path);
    },

    async upload(dealId, { relativePath, body, length, contentType }) {
      if (!Number.isFinite(length) || length < 0) {
        throw Object.assign(new Error("Invalid content length"), { status: 400 });
      }
      if (length > MAX_FILE_SIZE) {
        throw Object.assign(
          new Error(
            "File exceeds the 50MB limit. Split large files or upload in smaller batches.",
          ),
          { status: 413 },
        );
      }

      const folderPath = await resolvePath(dealId);
      if (!folderPath) {
        throw Object.assign(new Error("Deal not found"), { status: 404 });
      }

      const relative = sanitizeRelativePath(relativePath);
      if (!relative) {
        throw Object.assign(new Error("Invalid file path"), { status: 400 });
      }

      const remoteRelative = `${folderPath}/${relative}`;
      const lastSlash = remoteRelative.lastIndexOf("/");
      const targetDir = remoteRelative.slice(0, lastSlash);
      const baseName = relative.split("/").pop() ?? "";

      await ensureDirectoryTree(client, [targetDir]);
      const finalPath = await resolveUniqueFilePath(client, targetDir, baseName);

      const ok = await putFile({
        finalPath,
        body,
        length,
        contentType,
      });
      if (!ok) {
        throw new Error("Upload to Nextcloud failed");
      }

      const finalName = finalPath.split("/").pop() ?? baseName;
      return { path: finalPath, name: finalName, size: length };
    },

    async download(dealId, path) {
      const folderPath = await resolvePath(dealId);
      if (!folderPath) {
        throw Object.assign(new Error("Deal not found"), { status: 404 });
      }
      if (!path.startsWith(`${folderPath}/`) || path.includes("..")) {
        throw Object.assign(new Error("Invalid file path"), { status: 400 });
      }
      const exists = await fileExists(client, path);
      if (!exists) {
        throw Object.assign(new Error("File not found"), { status: 404 });
      }
      const contents = await getFileContents(client, path);
      const stat = await client.stat(path);
      const statData = "data" in stat ? stat.data : stat;
      const storedMime = statData.mime || "";
      return {
        contents,
        mimeType: storedMime || "application/octet-stream",
        fileName: path.split("/").pop() ?? "file",
      };
    },
  };
}

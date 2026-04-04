import type { WebDAVClient } from "webdav";
import { sanitizeDealFolderSegment } from "./sanitize";

function dealFolderPath(dealName: string): { folderName: string; path: string } {
  const sanitizedName = sanitizeDealFolderSegment(dealName);
  const folderName = `Deal_${sanitizedName}`;
  return { folderName, path: `/Deals/${folderName}` };
}

function httpStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

/**
 * Creates `/Deals/Deal_<sanitized>` if needed. Returns relative path e.g. `/Deals/Deal_foo`.
 */
export async function createDealFolder(
  client: WebDAVClient,
  dealName: string,
): Promise<string> {
  const { path } = dealFolderPath(dealName);
  try {
    await client.createDirectory(path, { recursive: true });
    return path;
  } catch (e: unknown) {
    const st = httpStatus(e);
    if (st === 405 || st === 409) {
      return path;
    }
    throw new Error(
      `Failed to create Nextcloud folder: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function renameDealFolder(
  client: WebDAVClient,
  oldDealName: string,
  newDealName: string,
): Promise<string> {
  const oldP = dealFolderPath(oldDealName);
  const newP = dealFolderPath(newDealName);

  if (oldP.folderName === newP.folderName) {
    return newP.path;
  }

  const oldExists = await client.exists(oldP.path);
  if (!oldExists) {
    return createDealFolder(client, newDealName);
  }

  try {
    await client.moveFile(oldP.path, newP.path, { overwrite: false });
    return newP.path;
  } catch (e: unknown) {
    const st = httpStatus(e);
    if (st === 412) {
      throw new Error(
        `Cannot rename folder: destination folder "${newP.folderName}" already exists`,
      );
    }
    if (st === 404) {
      return createDealFolder(client, newDealName);
    }
    throw new Error(
      `Failed to rename Nextcloud folder: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function deleteDealFolder(
  client: WebDAVClient,
  dealName: string,
): Promise<string> {
  const { path } = dealFolderPath(dealName);
  try {
    await client.deleteFile(path);
    return path;
  } catch (e: unknown) {
    const st = httpStatus(e);
    if (st === 404) {
      return path;
    }
    if (st === 401 || st === 403) {
      throw new Error(
        `Authentication failed when deleting Nextcloud folder: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    throw new Error(
      `Failed to delete Nextcloud folder: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

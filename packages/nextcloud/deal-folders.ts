import type { WebDAVClient } from "webdav";
import { dealFolderPath } from "./paths";
import { ensureDirectory } from "./files";

function folderMeta(dealSlug: string): { folderName: string; path: string } {
  const path = dealFolderPath(dealSlug);
  const folderName = path.split("/").pop() ?? dealSlug;
  return { folderName, path };
}

function httpStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

/**
 * Creates `/investor-portal/deals/<slug>` (and parents) if needed. Returns the
 * full remote path, e.g. `/investor-portal/deals/packaging-13`.
 */
export async function createDealFolder(
  client: WebDAVClient,
  dealSlug: string,
): Promise<string> {
  const { path } = folderMeta(dealSlug);
  await ensureDirectory(client, path);
  return path;
}

export async function renameDealFolder(
  client: WebDAVClient,
  oldDealSlug: string,
  newDealSlug: string,
): Promise<string> {
  const oldP = folderMeta(oldDealSlug);
  const newP = folderMeta(newDealSlug);

  if (oldP.folderName === newP.folderName) {
    return newP.path;
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
      return createDealFolder(client, newDealSlug);
    }
    throw new Error(
      `Failed to rename Nextcloud folder: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function deleteDealFolder(
  client: WebDAVClient,
  dealSlug: string,
): Promise<string> {
  const { path } = folderMeta(dealSlug);
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

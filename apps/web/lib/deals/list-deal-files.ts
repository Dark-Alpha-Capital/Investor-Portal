import slugify from "slugify";
import { getDealById } from "@repo/db/queries";
import {
  createNextcloudClientFromEnv,
  fileExists,
  listFiles,
  type DealFile,
} from "@repo/nextcloud";

export type { DealFile };

/**
 * Lists all files in a specific Deal folder.
 */
export async function listDealFiles(folderPath: string): Promise<DealFile[]> {
  const client = createNextcloudClientFromEnv();
  return listFiles(client, folderPath);
}

/**
 * Get all files for a deal by dealId
 */
export async function getDealFilesByDealId(
  dealId: string,
): Promise<DealFile[]> {
  try {
    const dealRecord = await getDealById(dealId);
    if (!dealRecord) {
      return [];
    }

    const dealSlug =
      dealRecord.slug ||
      slugify(dealRecord.name, { lower: true, strict: true });
    const sanitizedName = dealSlug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderPath = `/Deals/Deal_${sanitizedName}`;

    const client = createNextcloudClientFromEnv();
    const exists = await fileExists(client, folderPath);
    if (!exists) {
      return [];
    }

    return listFiles(client, folderPath);
  } catch (error) {
    console.error("Error listing deal files:", error);
    return [];
  }
}

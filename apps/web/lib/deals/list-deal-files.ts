import { createDealFileStore, type DealEntry, type DealFile } from "./deal-file-store";

export type { DealEntry, DealFile };

/**
 * List the root of a deal folder (folders + files at the top level).
 * Delegates to the deal-file store (single source of truth for folder paths).
 */
export async function getDealFilesByDealId(
  dealId: string,
): Promise<DealEntry[]> {
  const { folders, files } = await createDealFileStore().listFolder(dealId);
  return [...folders, ...files];
}

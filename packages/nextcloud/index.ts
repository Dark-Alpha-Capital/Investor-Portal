export type { NextcloudConfig, DealFile } from "./types";
export {
  createNextcloudClient,
  createNextcloudClientFromEnv,
  getNextcloudConfigFromEnv,
} from "./client";
export {
  sanitizeUploadFileName,
  sanitizeDealFolderSegment,
} from "./sanitize";
export {
  createDealFolder,
  renameDealFolder,
  deleteDealFolder,
} from "./deal-folders";
export {
  listFiles,
  fileExists,
  getFileContents,
  ensureDirectory,
  uploadBuffer,
} from "./files";

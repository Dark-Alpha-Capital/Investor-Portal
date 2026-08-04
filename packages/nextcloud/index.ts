export type { NextcloudConfig, DealFile, DealEntry } from "./types";
export {
  createNextcloudClient,
  createNextcloudClientFromEnv,
  getNextcloudConfigFromEnv,
} from "./client";
export {
  sanitizeUploadFileName,
  sanitizeDealFolderSegment,
  sanitizeRelativePath,
} from "./sanitize";
export {
  INVESTOR_PORTAL_ROOT,
  sanitizePathSegment,
  dealFolderPath,
  investorKycFolderPath,
} from "./paths";
export {
  createDealFolder,
  renameDealFolder,
  deleteDealFolder,
} from "./deal-folders";
export {
  listFiles,
  listFolder,
  fileExists,
  getFileContents,
  ensureDirectory,
  ensureDirectoryTree,
  uploadBuffer,
  uploadFileStream,
  resolveUniqueFilePath,
  deleteFile,
} from "./files";

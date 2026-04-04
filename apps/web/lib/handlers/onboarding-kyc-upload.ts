import { Buffer } from "node:buffer";
import {
  createNextcloudClientFromEnv,
  ensureDirectory,
  uploadBuffer,
  sanitizeUploadFileName,
} from "@repo/nextcloud";

export type OnboardingKycFileInput = {
  documentType: string;
  fileName: string;
  fileBuffer: string;
  mimeType: string;
  size: number;
};

export type OnboardingKycUploadData = {
  onboardingId: string;
  investorId: string;
  files: OnboardingKycFileInput[];
};

export async function runOnboardingKycUpload(
  data: OnboardingKycUploadData,
): Promise<{
  success: true;
  uploadedCount: number;
  totalFiles: number;
  uploadedFiles: Array<{
    documentType: string;
    fileName: string;
    filePath: string;
  }>;
}> {
  const { onboardingId, investorId, files } = data;

  if (!onboardingId || !investorId || !files?.length) {
    throw new Error(
      "Invalid job data: onboardingId, investorId, and files are required",
    );
  }

  const client = createNextcloudClientFromEnv();
  const folderPath = `/investors/${investorId}/onboarding/kyc-files`;
  await ensureDirectory(client, folderPath);

  const uploadedFiles: Array<{
    documentType: string;
    fileName: string;
    filePath: string;
  }> = [];

  for (const file of files) {
    if (!file?.fileName || !file?.fileBuffer || !file?.mimeType) {
      throw new Error(
        "Invalid file data: fileName, fileBuffer, and mimeType are required",
      );
    }

    const fileBuffer = Buffer.from(file.fileBuffer, "base64");
    if (fileBuffer.length === 0) {
      throw new Error("Decoded file buffer is empty");
    }
    if (fileBuffer.length !== file.size) {
      throw new Error(
        `File size mismatch. Expected ${file.size}, got ${fileBuffer.length}`,
      );
    }

    const sanitizedFileName = sanitizeUploadFileName(file.fileName);
    const remoteFilePath = `${folderPath}/${sanitizedFileName}`;

    const ok = await uploadBuffer(client, remoteFilePath, fileBuffer, {
      overwrite: true,
    });
    if (!ok) {
      throw new Error(`Failed to upload file to Nextcloud: ${file.fileName}`);
    }

    uploadedFiles.push({
      documentType: file.documentType || "unknown",
      fileName: sanitizedFileName,
      filePath: remoteFilePath,
    });
  }

  return {
    success: true,
    uploadedCount: uploadedFiles.length,
    totalFiles: files.length,
    uploadedFiles,
  };
}

import { Job } from "bullmq";
import { createClient } from "webdav";

interface OnboardingFileJobData {
  onboardingId: string;
  investorId: string;
  files: Array<{
    documentType: string;
    fileName: string;
    fileBuffer: string; // base64 encoded
    mimeType: string;
    size: number;
  }>;
}

const onboardingHandler = async (job: Job<OnboardingFileJobData>) => {
  console.log(`[Onboarding Worker] Starting job ${job.id}`);
  const { onboardingId, investorId, files } = job.data;

  // Validate inputs
  if (!onboardingId || !investorId || !files || files.length === 0) {
    throw new Error(
      "Invalid job data: onboardingId, investorId, and files are required"
    );
  }

  // Validate Nextcloud configuration
  if (
    !process.env.NEXTCLOUD_URL ||
    !process.env.NEXTCLOUD_USER ||
    !process.env.NEXTCLOUD_PASSWORD
  ) {
    throw new Error(
      "Nextcloud configuration is missing. Please set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_PASSWORD environment variables."
    );
  }

  console.log(
    `[Onboarding Worker] Processing ${files.length} files for investor ${investorId}`
  );

  // Create webdav client
  const client = createClient(
    `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
    {
      username: process.env.NEXTCLOUD_USER,
      password: process.env.NEXTCLOUD_PASSWORD,
    }
  );

  // Construct folder path
  const folderPath = `/investors/${investorId}/onboarding/kyc-files`;

  // Ensure folder exists, create if it doesn't
  const folderExists = await client.exists(folderPath);
  if (!folderExists) {
    await client.createDirectory(folderPath, { recursive: true });
  }

  const totalFiles = files.length;
  let uploadedCount = 0;
  const uploadedFiles: Array<{
    documentType: string;
    fileName: string;
    filePath: string;
  }> = [];
  const errors: Array<{
    documentType: string;
    fileName: string;
    error: string;
  }> = [];

  // Update job progress
  await job.updateProgress(0);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate file data
    if (!file?.fileName || !file?.fileBuffer || !file?.mimeType) {
      const errorMsg = `Invalid file data at index ${i}: fileName, fileBuffer, and mimeType are required`;
      console.error(`[Onboarding Worker] ${errorMsg}`);
      errors.push({
        documentType: file?.documentType || "unknown",
        fileName: file?.fileName || "unknown",
        error: errorMsg,
      });
      continue;
    }

    try {
      // Decode base64 to buffer
      const fileBuffer = Buffer.from(file.fileBuffer, "base64");

      if (fileBuffer.length === 0) {
        throw new Error("Decoded file buffer is empty");
      }

      // Verify decoded buffer size matches expected size
      if (fileBuffer.length !== file.size) {
        throw new Error(
          `File size mismatch. Expected ${file.size}, got ${fileBuffer.length}`
        );
      }

      // Sanitize file name to prevent path traversal and invalid characters
      const sanitizedFileName = file.fileName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.\./g, "_"); // Prevent path traversal
      const remoteFilePath = `${folderPath}/${sanitizedFileName}`;

      // Upload file using putFileContents
      const success = await client.putFileContents(remoteFilePath, fileBuffer, {
        overwrite: true,
        contentLength: fileBuffer.length,
      });

      if (!success) {
        throw new Error("Failed to upload file to Nextcloud");
      }

      uploadedFiles.push({
        documentType: file.documentType || "unknown",
        fileName: sanitizedFileName,
        filePath: remoteFilePath,
      });

      uploadedCount++;

      // Update progress (0-100)
      const progress = Math.round((uploadedCount / totalFiles) * 100);
      await job.updateProgress(progress);

      console.log(
        `[Onboarding Worker] Successfully uploaded ${uploadedCount}/${totalFiles}: ${sanitizedFileName}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      errors.push({
        documentType: file.documentType || "unknown",
        fileName: file.fileName,
        error: errorMessage,
      });

      console.error(
        `[Onboarding Worker] CRITICAL: Failed to upload ${file.fileName}:`,
        errorMessage
      );

      // Throw error immediately - file upload failures are critical
      throw new Error(
        `CRITICAL: Failed to upload file ${file.fileName} (${file.documentType}): ${errorMessage}. Job aborted.`
      );
    }
  }

  // Verify all files were uploaded successfully
  if (errors.length > 0) {
    throw new Error(
      `CRITICAL: ${errors.length} file(s) failed to upload. Errors: ${JSON.stringify(errors)}`
    );
  }

  if (uploadedCount !== totalFiles) {
    throw new Error(
      `CRITICAL: Upload count mismatch. Expected ${totalFiles}, uploaded ${uploadedCount}`
    );
  }

  // Final progress update
  await job.updateProgress(100);

  console.log(
    `[Onboarding Worker] Job ${job.id} completed successfully. All ${uploadedCount} files uploaded.`
  );

  return {
    success: true,
    uploadedCount,
    totalFiles,
    uploadedFiles,
  };
};

export default onboardingHandler;

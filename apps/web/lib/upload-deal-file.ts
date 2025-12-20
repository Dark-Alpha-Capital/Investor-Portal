/**
 * Utility function to upload a file to a deal folder via tRPC
 * Converts File object to base64 and calls the uploadFile mutation
 */

export async function uploadDealFile(
  dealId: string,
  file: File,
  trpcCaller: {
    deals: {
      uploadFile: (input: {
        dealId: string;
        fileName: string;
        fileData: string;
        fileType: string;
        fileSize: number;
      }) => Promise<{
        success: boolean;
        message: string;
        file: {
          name: string;
          size: number;
          mimeType: string;
          downloadUrl: string;
          lastModified: string;
        };
      }>;
    };
  }
) {
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString("base64");

  // Upload via tRPC
  return await trpcCaller.deals.uploadFile({
    dealId,
    fileName: file.name,
    fileData: base64Data,
    fileType: file.type,
    fileSize: file.size,
  });
}


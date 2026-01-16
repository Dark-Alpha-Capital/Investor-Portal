/**
 * Optimized file to base64 conversion
 * Uses Promise.all for parallel processing when multiple files
 */

export interface FileToProcess {
  documentType: string;
  name: string;
  type: string;
  size: number;
  buffer: string; // base64 encoded
}

/**
 * Convert a single file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binary = bytes.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    ""
  );
  return btoa(binary);
}

/**
 * Convert multiple files to base64 in parallel
 * Following React best practices: Promise.all() for Independent Operations (1.4)
 */
export async function convertFilesToBase64(
  files: Record<string, File | null>
): Promise<FileToProcess[]> {
  // Filter out null files and create conversion promises
  const fileEntries = Object.entries(files).filter(
    (entry): entry is [string, File] => entry[1] instanceof File
  );

  // Convert all files in parallel
  const conversionPromises = fileEntries.map(async ([key, file]) => {
    const buffer = await fileToBase64(file);
    return {
      documentType: key,
      name: file.name,
      type: file.type,
      size: file.size,
      buffer,
    };
  });

  return Promise.all(conversionPromises);
}

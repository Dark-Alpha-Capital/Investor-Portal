import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.split(String.raw`\n`).join("\n"),
  },
});

const BUCKET = process.env.GCLOUD_BUCKET;

/**
 * Uploads a file to Google Cloud Storage as a private file (not publicly accessible)
 * @param fileBuffer The file buffer to upload
 * @param fileName The filename/path to use in GCS
 * @param contentType The MIME type of the file
 * @returns The GCS path (gs://bucket/path) or null if upload fails
 */
export const uploadPrivateFile = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string | null> => {
  try {
    const bucket = storage.bucket(BUCKET as string);
    const blob = bucket.file(fileName);

    // Upload file with private ACL (not publicly accessible)
    await blob.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "private, max-age=0",
      },
      // Make file private (not publicly accessible)
      public: false,
    });

    // Return GCS path format
    return `gs://${BUCKET}/${fileName}`;
  } catch (error) {
    console.error("Error uploading private file to GCS:", error);
    return null;
  }
};







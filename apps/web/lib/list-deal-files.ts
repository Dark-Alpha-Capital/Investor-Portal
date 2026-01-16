import { createClient, type FileStat } from "webdav";
import slugify from "slugify";
import { getDealById } from "@repo/db/queries";

// Interface for deal files
export interface DealFile {
  name: string;
  size: number;
  lastModified: string;
  mimeType: string;
  downloadUrl: string;
}

// Get Nextcloud configuration
const getNextcloudConfig = () => {
  const url = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;

  if (!url || !user || !password) {
    throw new Error(
      "Nextcloud configuration is missing. Please set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_PASSWORD environment variables."
    );
  }

  return { url, user, password };
};

// Initialize the Client with Basic Auth
const getClient = () => {
  const { url, user, password } = getNextcloudConfig();
  const clientUrl = `${url}/remote.php/dav/files/${user}`;

  return createClient(clientUrl, {
    username: user,
    password: password,
  });
};

/**
 * Lists all files in a specific Deal folder.
 * @param folderPath - The path relative to the user's root, e.g., "/Deals/Deal_Alpha"
 */
export async function listDealFiles(folderPath: string): Promise<DealFile[]> {
  try {
    const client = createClient(
      `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
      {
        username: process.env.NEXTCLOUD_USER,
        password: process.env.NEXTCLOUD_PASSWORD,
      }
    );

    console.log("Listing files for folder:", { folderPath });

    // Get directory contents
    const contents = await client.getDirectoryContents(folderPath);
    console.log("Contents:", { contents });
    // Transform the data
    const files = (contents as FileStat[]).map((item) => ({
      name: item.basename,
      size: item.size,
      lastModified: item.lastmod,
      mimeType: item.mime ?? "",
      downloadUrl: client.getFileDownloadLink(item.filename),
    }));

    return files.filter((f) => f.mimeType !== "httpd/unix-directory");
  } catch (error) {
    console.error("Error connecting to Nextcloud:", error);
    throw error;
  }
}

/**
 * Get all files for a deal by dealId
 * @param dealId The deal ID
 * @returns Array of deal files, or empty array if folder doesn't exist or on error
 */
export async function getDealFilesByDealId(
  dealId: string
): Promise<DealFile[]> {
  try {
    // Get deal to construct folder path
    const dealRecord = await getDealById(dealId);
    if (!dealRecord) {
      return [];
    }

    // Construct folder path based on deal slug
    const dealSlug =
      dealRecord.slug ||
      slugify(dealRecord.name, { lower: true, strict: true });
    const sanitizedName = dealSlug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderPath = `/Deals/Deal_${sanitizedName}`;

    const client = createClient(
      `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
      {
        username: process.env.NEXTCLOUD_USER,
        password: process.env.NEXTCLOUD_PASSWORD,
      }
    );

    const folderExists = await client.exists(folderPath);
    if (!folderExists) {
      return [];
    }

    const contents = await client.getDirectoryContents(folderPath);
    const files = (contents as FileStat[])
      .map((item) => ({
        name: item.basename,
        size: item.size,
        lastModified: item.lastmod,
        mimeType: item.mime ?? "",
        downloadUrl: client.getFileDownloadLink(item.filename),
      }))
      .filter((f) => f.mimeType !== "httpd/unix-directory");

    return files;
  } catch (error) {
    console.error("Error listing deal files:", error);
    return [];
  }
}

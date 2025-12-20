import { createClient, type FileStat } from "webdav";
// import dotenv from "dotenv";

// dotenv.config();

// 1. Initialize the Client with Basic Auth
// This client automatically adds the 'Authorization: Basic ...' header to every request
const client = createClient(
  `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
  {
    username: process.env.NEXTCLOUD_USER,
    password: process.env.NEXTCLOUD_PASSWORD,
  }
);

// Interface for your own frontend (cleaner than what Nextcloud gives you)
interface DealFile {
  name: string;
  size: number;
  lastModified: string;
  mimeType: string;
  downloadUrl: string; // The link to download it
}

/**
 * Lists all files in a specific Deal folder.
 * @param folderPath - The path relative to the user's root, e.g., "/Deals/Deal_Alpha"
 */
export async function listDealFiles(folderPath: string): Promise<DealFile[]> {
  try {
    // 2. Make the Request (Under the hood: PROPFIND method)
    // verify calls a lightweight 'stat' to ensure path exists and auth works
    if ((await client.exists(folderPath)) === false) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    // getDirectoryContents returns an array of file objects
    const contents = await client.getDirectoryContents(folderPath);

    // 3. Transform the Data
    // The library returns generic types, so we map them to our clean interface
    // We cast 'contents' because it can sometimes be a single object if not careful,
    // but for a directory query it's usually an array.
    const files = (contents as FileStat[]).map((item) => ({
      name: item.basename,
      size: item.size,
      lastModified: item.lastmod,
      mimeType: item.mime ?? "",
      // Construct a download link (or use the one provided by client if public)
      downloadUrl: client.getFileDownloadLink(item.filename),
    }));

    // Filter out sub-folders if you only want files
    return files.filter((f) => f.mimeType !== "httpd/unix-directory");
  } catch (error) {
    console.error("Error connecting to Nextcloud:", error);
    throw error;
  }
}

// --- Usage Example ---
(async () => {
  const files = await listDealFiles("/Deals/Project_Titan");
  console.log(files);
})();

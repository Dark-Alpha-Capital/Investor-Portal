import axios from "axios";

/**
 * Creates a new folder in Nextcloud for a specific deal.
 * @param dealId - The unique ID from your deal database
 * @param dealName - The human-readable name of the deal
 */
export async function createDealFolder(dealId: string, dealName: string) {
  // Sanitize the deal name to ensure it's a valid folder name
  const sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const folderName = `Deal_${dealId}_${sanitizedName}`;

  const url = `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}/Deals/${folderName}`;

  try {
    await axios({
      method: "MKCOL",
      url: url,
      auth: {
        username: process.env.NEXTCLOUD_USER as string,
        password: process.env.NEXTCLOUD_PASSWORD as string,
      },
    });

    // Return the relative path to store in your database
    return `/Deals/${folderName}`;
  } catch (error: any) {
    // Handle error if folder already exists (405) or auth fails (401)
    if (error.response?.status === 405) {
      console.log("Folder already exists.");
      return `/Deals/${folderName}`;
    }
    throw new Error(`Failed to create Nextcloud folder: ${error.message}`);
  }
}

(async () => {
  const folderPath = await createDealFolder("123", "Test Deal");
  console.log(folderPath);
})();

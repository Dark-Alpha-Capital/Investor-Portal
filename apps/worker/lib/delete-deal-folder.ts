import axios from "axios";

/**
 * Deletes a folder in Nextcloud for a specific deal.
 * @param dealName - The deal name (used to construct folder path)
 */
export async function deleteDealFolder(dealName: string) {
  console.log("Deleting deal folder for:", dealName);

  // Sanitize the deal name to ensure it matches the folder name format
  const sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const folderName = `Deal_${sanitizedName}`;

  const url = `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}/Deals/${folderName}`;

  try {
    // Use DELETE method to remove the folder and all its contents
    await axios({
      method: "DELETE",
      url: url,
      auth: {
        username: process.env.NEXTCLOUD_USER as string,
        password: process.env.NEXTCLOUD_PASSWORD as string,
      },
    });

    console.log(`Successfully deleted folder: /Deals/${folderName}`);
    return `/Deals/${folderName}`;
  } catch (error: any) {
    // Handle error if folder doesn't exist (404) - this is okay, folder might already be deleted
    if (error.response?.status === 404) {
      console.log(
        `Folder does not exist: /Deals/${folderName}. Skipping deletion.`
      );
      return `/Deals/${folderName}`;
    }

    // Handle auth failures (401, 403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        `Authentication failed when deleting Nextcloud folder: ${error.message}`
      );
    }

    throw new Error(`Failed to delete Nextcloud folder: ${error.message}`);
  }
}

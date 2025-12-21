import axios from "axios";

/**
 * Renames a folder in Nextcloud for a specific deal.
 * @param oldDealName - The old deal name (used to construct old folder path)
 * @param newDealName - The new deal name (used to construct new folder path)
 */
export async function renameDealFolder(
  oldDealName: string,
  newDealName: string
) {
  console.log("Renaming deal folder from", oldDealName, "to", newDealName);
  // Sanitize the deal names to ensure they're valid folder names
  const sanitizedOldName = oldDealName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const sanitizedNewName = newDealName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  const oldFolderName = `Deal_${sanitizedOldName}`;
  const newFolderName = `Deal_${sanitizedNewName}`;

  // If names are the same after sanitization, no need to rename
  if (oldFolderName === newFolderName) {
    console.log(
      "Folder names are the same after sanitization, skipping rename."
    );
    return `/Deals/${newFolderName}`;
  }

  const oldUrl = `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}/Deals/${oldFolderName}`;
  const newUrl = `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}/Deals/${newFolderName}`;

  try {
    // Use MOVE method to rename the folder in WebDAV
    await axios({
      method: "MOVE",
      url: oldUrl,
      headers: {
        Destination: newUrl,
        Overwrite: "F", // Don't overwrite if destination exists
      },
      auth: {
        username: process.env.NEXTCLOUD_USER as string,
        password: process.env.NEXTCLOUD_PASSWORD as string,
      },
    });

    // Return the new relative path
    return `/Deals/${newFolderName}`;
  } catch (error: any) {
    // Handle error if folder doesn't exist (404) or auth fails (401)
    if (error.response?.status === 404) {
      console.log("Old folder does not exist, creating new folder instead.");
      // If old folder doesn't exist, create the new one
      const createUrl = `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}/Deals/${newFolderName}`;
      try {
        await axios({
          method: "MKCOL",
          url: createUrl,
          auth: {
            username: process.env.NEXTCLOUD_USER as string,
            password: process.env.NEXTCLOUD_PASSWORD as string,
          },
        });
        return `/Deals/${newFolderName}`;
      } catch (createError: any) {
        if (createError.response?.status === 405) {
          console.log("New folder already exists.");
          return `/Deals/${newFolderName}`;
        }
        throw new Error(
          `Failed to create Nextcloud folder: ${createError.message}`
        );
      }
    }
    // Handle error if destination already exists (412)
    if (error.response?.status === 412) {
      throw new Error(
        `Cannot rename folder: destination folder "${newFolderName}" already exists`
      );
    }
    throw new Error(`Failed to rename Nextcloud folder: ${error.message}`);
  }
}

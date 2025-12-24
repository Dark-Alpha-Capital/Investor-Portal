import axios from "axios";

/**
 * Uploads a file to Nextcloud for investor onboarding KYC documents
 * @param investorId - The unique investor/user ID
 * @param fileName - The name of the file to upload
 * @param fileBuffer - The file buffer (base64 decoded)
 * @param mimeType - The MIME type of the file
 * @returns The path where the file was stored
 */
export async function uploadOnboardingFile(
  investorId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // Validate configuration
  const url = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;

  if (!url || !user || !password) {
    throw new Error(
      "Nextcloud configuration is missing. Please set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_PASSWORD environment variables."
    );
  }

  // Validate inputs
  if (!investorId || !fileName || !fileBuffer || !mimeType) {
    throw new Error(
      "Missing required parameters: investorId, fileName, fileBuffer, and mimeType are required"
    );
  }

  // Remove trailing slash from URL if present
  const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  console.log(`[Nextcloud] Starting upload for investor: ${investorId}`);
  console.log(`[Nextcloud] File name: ${fileName}`);
  console.log(`[Nextcloud] File size: ${fileBuffer.length} bytes`);

  // Simple path construction - no complex normalization
  const investorsDir = `investors/${investorId}`;
  const onboardingDir = `${investorsDir}/onboarding`;
  const kycFilesDir = `${onboardingDir}/kyc-files`;

  // Create directories one by one
  const directories = [
    { name: "investors", path: investorsDir },
    { name: "onboarding", path: onboardingDir },
    { name: "kyc-files", path: kycFilesDir },
  ];

  for (const dir of directories) {
    const dirUrl = `${baseUrl}/remote.php/dav/files/${user}/${dir.path}`;
    console.log(`[Nextcloud] Creating directory: ${dir.name} at ${dirUrl}`);

    try {
      await axios({
        method: "MKCOL",
        url: dirUrl,
        auth: {
          username: user,
          password: password,
        },
      });
      console.log(`[Nextcloud] ✓ Successfully created directory: ${dir.path}`);
    } catch (error: any) {
      const status = error.response?.status;
      // 405 (Method Not Allowed) and 409 (Conflict) mean folder already exists
      if (status === 405 || status === 409) {
        console.log(
          `[Nextcloud] ✓ Directory already exists: ${dir.path} (status: ${status})`
        );
        continue;
      }

      // Any other error is critical
      const statusText = error.response?.statusText || "";
      const errorMessage = error.response?.data || error.message;
      console.error(`[Nextcloud] ✗ Failed to create directory: ${dir.path}`);
      console.error(`[Nextcloud] URL: ${dirUrl}`);
      console.error(`[Nextcloud] Status: ${status} ${statusText}`);
      console.error(`[Nextcloud] Error: ${errorMessage}`);
      throw new Error(
        `CRITICAL: Failed to create directory ${dir.path}: ${status} ${statusText} - ${errorMessage}`
      );
    }
  }

  // Upload the file - simple URL construction
  const encodedFileName = encodeURIComponent(fileName);
  const filePath = `${kycFilesDir}/${encodedFileName}`;
  const fileUrl = `${baseUrl}/remote.php/dav/files/${user}/${filePath}`;

  console.log(`[Nextcloud] Uploading file...`);
  console.log(`[Nextcloud] File path: ${filePath}`);
  console.log(`[Nextcloud] Full URL: ${fileUrl}`);

  try {
    const response = await axios({
      method: "PUT",
      url: fileUrl,
      data: fileBuffer,
      headers: {
        "Content-Type": mimeType,
      },
      auth: {
        username: user,
        password: password,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log(`[Nextcloud] ✓ Upload response status: ${response.status}`);

    // Verify successful upload (status 201 Created or 204 No Content)
    if (response.status !== 201 && response.status !== 204) {
      throw new Error(
        `Unexpected response status ${response.status} when uploading file`
      );
    }

    const returnPath = `/${filePath}`;
    console.log(`[Nextcloud] ✓ File uploaded successfully to: ${returnPath}`);
    return returnPath;
  } catch (error: any) {
    const status = error.response?.status;
    const statusText = error.response?.statusText || "";
    const errorMessage = error.response?.data || error.message;

    console.error(`[Nextcloud] ✗ Failed to upload file: ${fileName}`);
    console.error(`[Nextcloud] URL: ${fileUrl}`);
    console.error(`[Nextcloud] Status: ${status} ${statusText}`);
    console.error(`[Nextcloud] Error: ${errorMessage}`);

    throw new Error(
      `Failed to upload file ${fileName} to Nextcloud: ${status} ${statusText} - ${errorMessage}`
    );
  }
}

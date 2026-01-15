import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { createClient, type FileStat } from "webdav";
import slugify from "slugify";

/**
 * Cached function to fetch deal files from Nextcloud.
 * Uses Next.js Cache Components with cacheLife and cacheTag.
 */
export async function getDealFilesCached(dealId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag(`deal-${dealId}-files`);

  // Get deal to construct folder path
  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRecord) {
    return {
      success: false as const,
      files: [],
    };
  }

  // Construct folder path based on deal slug
  // The worker creates folders using: Deal_{sanitizedName} where sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
  // So we need to match that pattern exactly
  const dealSlug =
    dealRecord.slug ||
    slugify(dealRecord.name, { lower: true, strict: true });

  // Convert slug to match worker's sanitization (replace non-alphanumeric with underscore, lowercase)
  // slugify uses hyphens, but worker uses underscores
  const sanitizedName = dealSlug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const folderPath = `/Deals/Deal_${sanitizedName}`;

  try {
    const client = createClient(
      `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
      {
        username: process.env.NEXTCLOUD_USER,
        password: process.env.NEXTCLOUD_PASSWORD,
      }
    );

    // Check if folder exists first
    const folderExists = await client.exists(folderPath);

    if (!folderExists) {
      return {
        success: true as const,
        files: [],
      };
    }

    // Get directory contents
    const contents = await client.getDirectoryContents(folderPath);
    // Transform the data
    const files = (contents as FileStat[]).map((item) => ({
      name: item.basename,
      size: item.size,
      lastModified: item.lastmod,
      mimeType: item.mime ?? "",
      downloadUrl: client.getFileDownloadLink(item.filename),
    }));

    // Filter out directories
    return {
      success: true as const,
      files: files.filter((f) => f.mimeType !== "httpd/unix-directory"),
    };
  } catch (error) {
    console.error("Error listing files:", error);

    // If folder doesn't exist, return empty array instead of error
    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
      return {
        success: true as const,
        files: [],
      };
    }
    
    // For other errors, return empty array to avoid breaking the page
    return {
      success: true as const,
      files: [],
    };
  }
}

export type DealFilesData = Awaited<ReturnType<typeof getDealFilesCached>>;


import slugify from "slugify";
import {
  createNextcloudClientFromEnv,
  createDealFolder,
  renameDealFolder,
  deleteDealFolder,
} from "@repo/nextcloud";

const toSlug = (name: string): string =>
  slugify(name, { lower: true, strict: true });

export async function runDealFolderSync(
  jobName: string,
  data: Record<string, unknown>,
): Promise<{ folderPath: string }> {
  const client = createNextcloudClientFromEnv();

  if (jobName === "create-deal") {
    const deal = data.deal as { name: string; slug?: string };
    const slug = deal.slug || toSlug(deal.name);
    const folderPath = await createDealFolder(client, slug);
    return { folderPath };
  }

  if (jobName === "rename-deal") {
    const { oldDealName, newDealName } = data as {
      oldDealName: string;
      newDealName: string;
    };
    const folderPath = await renameDealFolder(
      client,
      toSlug(oldDealName),
      toSlug(newDealName),
    );
    return { folderPath };
  }

  if (jobName === "delete-deal") {
    const { dealName } = data as { dealName: string };
    const folderPath = await deleteDealFolder(client, toSlug(dealName));
    return { folderPath };
  }

  throw new Error(`Unknown deal folder job: ${jobName}`);
}

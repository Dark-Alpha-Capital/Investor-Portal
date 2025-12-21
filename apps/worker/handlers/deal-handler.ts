import { Job } from "bullmq";
import { createDealFolder } from "../lib/create-deal-folder";
import { renameDealFolder } from "../lib/rename-deal-folder";
import slugify from "slugify";

const dealHandler = async (job: Job) => {
  console.log(`[Deal Worker] Starting job ${job.id} of type ${job.name}`);

  if (job.name === "create-deal") {
    const { deal } = job.data;
    console.log("received deal", { deal });
    const slug = slugify(deal.name, { lower: true, strict: true });
    console.log("slug", { slug });
    const folderPath = await createDealFolder(slug);
    console.log("created folder", { folderPath });
  } else if (job.name === "rename-deal") {
    const { oldDealName, newDealName } = job.data;
    console.log("renaming deal folder", { oldDealName, newDealName });
    const folderPath = await renameDealFolder(oldDealName, newDealName);
    console.log("renamed folder", { folderPath });
  } else {
    console.warn(`Unknown job type: ${job.name}`);
  }
};

export default dealHandler;

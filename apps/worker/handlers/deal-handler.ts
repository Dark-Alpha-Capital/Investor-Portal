import { Job } from "bullmq";
import { createDealFolder } from "../lib/create-deal-folder";
import slugify from "slugify";

const dealHandler = async (job: Job) => {
  console.log(`[Deal Worker] Starting job ${job.id}`);
  const { deal } = job.data;
  console.log("received deal", { deal });
  const slug = slugify(deal.name, { lower: true, strict: true });
  console.log("slug", { slug });
  const folderPath = await createDealFolder(slug);
  console.log("created folder", { folderPath });
};

export default dealHandler;

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { reportHandler } from "./handlers/report-handler";
import dealHandler from "./handlers/deal-handler";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Worker 1: Handles Emails
// Concurrency: 10 (Process 10 emails at the same time)
const reportWorker = new Worker("report-queue", reportHandler, {
  connection,
  concurrency: 10,
});

const dealWorker = new Worker("deal-queue", dealHandler, {
  connection,
  concurrency: 10,
});

console.log("Workers are listening for jobs...");

reportWorker.on("failed", (job, err) =>
  console.error(`Report Job failed: ${err.message}`)
);

dealWorker.on("failed", (job, err) =>
  console.error(`Deal Job failed: ${err.message}`)
);

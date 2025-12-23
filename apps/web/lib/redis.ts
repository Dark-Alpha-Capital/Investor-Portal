import { Queue } from "bullmq";
import IORedis from "ioredis";

// BullMQ uses ioredis internally, so we create a shared ioredis connection
// and pass it to all queues to match the expected ConnectionOptions type.
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}
const redis = new IORedis(process.env.REDIS_URL);

export default redis;

export const emailQueue = new Queue("email-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if it fails
    backoff: { type: "exponential", delay: 1000 },
  },
});

// Queue 2: Report Queue
export const reportQueue = new Queue("report-queue", {
  connection: redis,
});

export const dealQueue = new Queue("deal-queue", {
  connection: redis,
});

// Queue 4: Onboarding File Upload Queue
export const onboardingQueue = new Queue("onboarding-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if it fails
    backoff: { type: "exponential", delay: 2000 },
  },
});

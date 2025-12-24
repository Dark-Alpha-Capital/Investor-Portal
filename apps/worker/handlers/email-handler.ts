import { Job } from "bullmq";
import {
  createResendClient,
  processEmailJob,
  EMAIL_CONFIG,
  type EmailJobData,
} from "@repo/mail";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set");
}

const resend = createResendClient(process.env.RESEND_API_KEY);

// Admin email for onboarding notifications - can be configured via env var
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_CONFIG.defaultAdminEmail;

const emailHandler = async (job: Job<EmailJobData>) => {
  console.log(`[Email Worker] Starting job ${job.id} - Type: ${job.data.type}`);

  const result = await processEmailJob(resend, job.data);

  console.log(
    `[Email Worker] Email sent successfully to ${result.to}. ID: ${result.emailId}`
  );

  return result;
};

export default emailHandler;
export { ADMIN_NOTIFICATION_EMAIL };

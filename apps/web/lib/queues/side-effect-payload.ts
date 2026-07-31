export type QueuePayload = {
  queue: "deal" | "onboarding" | "email";
  jobName: string;
  jobId: string;
  data: Record<string, unknown>;
};

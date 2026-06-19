type WorkflowStatusDetail = {
  status:
    | "queued"
    | "running"
    | "paused"
    | "errored"
    | "terminated"
    | "complete"
    | "waiting"
    | "waitingForPause"
    | "unknown";
  error?: { name: string; message: string };
  output?: unknown;
};

export type JobProgressResponse = {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed";
  progress: number;
  returnvalue?: unknown;
  failedReason?: string;
};

export function mapWorkflowStatusToJobProgress(
  jobId: string,
  details: WorkflowStatusDetail,
): JobProgressResponse {
  switch (details.status) {
    case "queued":
      return {
        jobId,
        state: "waiting",
        progress: 10,
      };
    case "running":
    case "waiting":
    case "waitingForPause":
    case "paused":
      return {
        jobId,
        state: "active",
        progress: 55,
      };
    case "complete":
      return {
        jobId,
        state: "completed",
        progress: 100,
        returnvalue: details.output,
      };
    case "errored":
    case "terminated":
      return {
        jobId,
        state: "failed",
        progress: 0,
        failedReason: details.error?.message ?? "Workflow failed",
      };
    default:
      return {
        jobId,
        state: "active",
        progress: 30,
      };
  }
}

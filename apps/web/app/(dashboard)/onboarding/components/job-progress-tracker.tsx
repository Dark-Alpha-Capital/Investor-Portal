"use client";

import { useEffect, useRef } from "react";
import { useJobTracking } from "@/contexts/job-tracking-context";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function JobProgressTracker() {
  const { jobs, updateJob, removeJob } = useJobTracking();
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Poll for job progress
  useEffect(() => {
    const activeJobs = Array.from(jobs.entries()).filter(
      ([_, job]) => job.state === "waiting" || job.state === "active"
    );

    // Clean up polling for jobs that are no longer active
    pollingRefs.current.forEach((timeoutId, jobId) => {
      const job = jobs.get(jobId);
      if (!job || (job.state !== "waiting" && job.state !== "active")) {
        clearTimeout(timeoutId);
        pollingRefs.current.delete(jobId);
      }
    });

    // Start polling for active jobs
    activeJobs.forEach(([jobId, job]) => {
      // Skip if already polling
      if (pollingRefs.current.has(jobId)) return;

      const pollJobProgress = async () => {
        const currentJob = jobs.get(jobId);
        // Stop if job is no longer active
        if (
          !currentJob ||
          (currentJob.state !== "waiting" && currentJob.state !== "active")
        ) {
          pollingRefs.current.delete(jobId);
          return;
        }

        try {
          const response = await fetch(
            `/api/trpc/onboarding.getJobProgress?input=${encodeURIComponent(
              JSON.stringify({ json: { jobId } })
            )}`
          );
          const data = await response.json();
          const result = data.result?.data?.json;

          if (result) {
            updateJob(jobId, {
              state: result.state as
                | "waiting"
                | "active"
                | "completed"
                | "failed",
              progress: result.progress || 0,
              failedReason: result.failedReason,
              returnvalue: result.returnvalue,
            });

            // Stop polling if job is completed or failed
            if (result.state === "completed" || result.state === "failed") {
              pollingRefs.current.delete(jobId);
              // Auto-remove completed jobs after 5 seconds
              if (result.state === "completed") {
                setTimeout(() => {
                  removeJob(jobId);
                }, 5000);
              }
              return;
            }

            // Continue polling if job is still active
            if (result.state === "waiting" || result.state === "active") {
              const timeoutId = setTimeout(pollJobProgress, 2000);
              pollingRefs.current.set(jobId, timeoutId);
            }
          }
        } catch (error) {
          console.error(`Error polling job progress for ${jobId}:`, error);
          // Retry after 2 seconds on error
          const timeoutId = setTimeout(pollJobProgress, 2000);
          pollingRefs.current.set(jobId, timeoutId);
        }
      };

      // Start polling after a short delay
      const timeoutId = setTimeout(pollJobProgress, 1000);
      pollingRefs.current.set(jobId, timeoutId);
    });

    // Cleanup function
    return () => {
      pollingRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pollingRefs.current.clear();
    };
  }, [jobs, updateJob, removeJob]);

  if (jobs.size === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {Array.from(jobs.values()).map((job) => (
        <div
          key={job.jobId}
          className="space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {job.state === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              {job.state === "failed" && (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {(job.state === "waiting" || job.state === "active") && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              <span className="font-medium text-sm">
                {job.state === "completed"
                  ? "Files uploaded successfully"
                  : job.state === "failed"
                    ? "Upload failed"
                    : "Uploading KYC files"}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {job.progress}%
            </span>
          </div>

          <Progress value={job.progress} />

          {job.state === "active" && job.returnvalue && (
            <div className="text-xs text-muted-foreground">
              Uploaded {job.returnvalue.uploadedCount || 0} of{" "}
              {job.returnvalue.totalFiles || 0} files
            </div>
          )}

          {job.state === "completed" && job.returnvalue && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Successfully uploaded {job.returnvalue.uploadedCount || 0} of{" "}
                {job.returnvalue.totalFiles || 0} files
              </div>
              {job.returnvalue.errors && job.returnvalue.errors.length > 0 && (
                <div className="text-destructive mt-2">
                  <div className="font-medium">Failed files:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {job.returnvalue.errors.map((error, idx) => (
                      <li key={idx}>
                        {error.fileName}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {job.state === "failed" && job.failedReason && (
            <div className="text-xs text-destructive">
              Error: {job.failedReason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

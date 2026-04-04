
import React, { createContext, useContext, useState, useCallback } from "react";

interface JobProgress {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed";
  progress: number;
  failedReason?: string;
  returnvalue?: {
    uploadedCount?: number;
    totalFiles?: number;
    uploadedFiles?: Array<{
      documentType: string;
      fileName: string;
      filePath: string;
    }>;
    errors?: Array<{
      documentType: string;
      fileName: string;
      error: string;
    }>;
  };
}

interface JobTrackingContextType {
  jobs: Map<string, JobProgress>;
  addJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  updateJob: (jobId: string, progress: Partial<JobProgress>) => void;
  clearJobs: () => void;
  getJob: (jobId: string) => JobProgress | undefined;
}

const JobTrackingContext = createContext<JobTrackingContextType | undefined>(
  undefined
);

export const JobTrackingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jobs, setJobs] = useState<Map<string, JobProgress>>(new Map());

  const addJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const newMap = new Map(prev);
      // Avoid duplicates
      if (!newMap.has(jobId)) {
        newMap.set(jobId, {
          jobId,
          state: "waiting",
          progress: 0,
        });
      }
      return newMap;
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });
  }, []);

  const updateJob = useCallback(
    (jobId: string, progress: Partial<JobProgress>) => {
      setJobs((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(jobId);
        if (existing) {
          newMap.set(jobId, { ...existing, ...progress });
        }
        return newMap;
      });
    },
    []
  );

  const clearJobs = useCallback(() => {
    setJobs(new Map());
  }, []);

  const getJob = useCallback(
    (jobId: string) => {
      return jobs.get(jobId);
    },
    [jobs]
  );

  return (
    <JobTrackingContext.Provider
      value={{ jobs, addJob, removeJob, updateJob, clearJobs, getJob }}
    >
      {children}
    </JobTrackingContext.Provider>
  );
};

export const useJobTracking = () => {
  const context = useContext(JobTrackingContext);
  if (context === undefined) {
    throw new Error(
      "useJobTracking must be used within a JobTrackingProvider"
    );
  }
  return context;
};


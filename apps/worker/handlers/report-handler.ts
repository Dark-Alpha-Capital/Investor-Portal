import { Job } from "bullmq";

/**
 * Generate a random delay between min and max milliseconds
 */
const randomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Simulate a delay with some variation
 */
const simulateWork = async (minMs: number, maxMs: number): Promise<void> => {
  const delay = randomDelay(minMs, maxMs);
  await new Promise((r) => setTimeout(r, delay));
};

export const reportHandler = async (job: Job) => {
  console.log(`[Report Worker] Starting job ${job.id}`);

  try {
    // Step 1: Initialization (5-15% progress, 500-2000ms)
    const initProgress = randomDelay(5, 15);
    await job.updateProgress(initProgress);
    console.log(
      `[Report Worker] Job ${job.id} - Initialization (${initProgress}%)`
    );
    await simulateWork(500, 2000);

    // Step 2: Fetching Data (30-50% progress, 1500-4000ms)
    // This step can vary a lot depending on data volume
    const fetchProgress = randomDelay(30, 50);
    await job.updateProgress(fetchProgress);
    console.log(
      `[Report Worker] Job ${job.id} - Fetching data (${fetchProgress}%)`
    );
    await simulateWork(1500, 4000);

    // Step 3: Processing Data (55-75% progress, 1000-3000ms)
    const processProgress = randomDelay(55, 75);
    await job.updateProgress(processProgress);
    console.log(
      `[Report Worker] Job ${job.id} - Processing data (${processProgress}%)`
    );
    await simulateWork(1000, 3000);

    // Step 4: Generating PDF (80-95% progress, 2000-5000ms)
    // PDF generation can be slow, especially for large documents
    const pdfProgress = randomDelay(80, 95);
    await job.updateProgress(pdfProgress);
    console.log(
      `[Report Worker] Job ${job.id} - Generating PDF (${pdfProgress}%)`
    );
    await simulateWork(2000, 5000);

    // Step 5: Finalizing (96-99% progress, 300-800ms)
    const finalProgress = randomDelay(96, 99);
    await job.updateProgress(finalProgress);
    console.log(
      `[Report Worker] Job ${job.id} - Finalizing (${finalProgress}%)`
    );
    await simulateWork(300, 800);

    // Step 6: Complete
    await job.updateProgress(100);
    console.log(`[Report Worker] Job ${job.id} - Completed`);

    // Return a result value (e.g., the URL of the PDF)
    return {
      success: true,
      pdfUrl: `https://example.com/reports/${job.id}.pdf`,
      completedAt: new Date().toISOString(),
      jobId: job.id,
    };
  } catch (error) {
    console.error(`[Report Worker] Job ${job.id} failed:`, error);
    throw error;
  }
};

import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
  type WorkflowStepContext,
} from "cloudflare:workers";
import {
  assertOnboardingKycPayload,
  fetchOutboxQueuePayload,
} from "../lib/workflows/workflow-outbox";
import type { QueuePayload } from "../lib/queues/side-effect-payload";
import {
  runOnboardingKycUpload,
  type OnboardingKycUploadData,
} from "../lib/handlers/onboarding-kyc-upload";

export type OnboardingKycWorkflowParams = { outboxId: string };

/**
 * Uploads investor KYC files from the outbox payload to Nextcloud.
 */
export class OnboardingKycWorkflow extends WorkflowEntrypoint<
  Env,
  OnboardingKycWorkflowParams
> {
  async run(
    event: WorkflowEvent<OnboardingKycWorkflowParams>,
    step: WorkflowStep,
  ): Promise<unknown> {
    const { outboxId } = event.payload;
    console.log(
      `[OnboardingKycWorkflow] start instanceId=${event.instanceId} outboxId=${outboxId}`,
    );

    const payload = await step.do(
      "load-onboarding-kyc-outbox",
      async (_ctx: WorkflowStepContext) => {
        const p = await fetchOutboxQueuePayload(outboxId);
        assertOnboardingKycPayload(p);
        console.log(
          `[OnboardingKycWorkflow] loaded outbox jobId=${p.jobId} files=${
            Array.isArray((p.data as { files?: unknown }).files)
              ? (p.data as { files: unknown[] }).files.length
              : "?"
          }`,
        );
        return structuredClone(p) as never;
      },
    );

    return await step.do(
      "upload-kyc-files-to-nextcloud",
      {
        retries: {
          limit: 3,
          delay: "2 seconds",
          backoff: "exponential",
        },
      },
      async (_ctx: WorkflowStepContext) => {
        const p = payload as QueuePayload;
        console.log(
          `[OnboardingKycWorkflow] uploading KYC files jobId=${p.jobId}`,
        );
        const result = (await runOnboardingKycUpload(
          p.data as unknown as OnboardingKycUploadData,
        )) as never;
        console.log(
          `[OnboardingKycWorkflow] upload step finished jobId=${p.jobId}`,
          result,
        );
        return result;
      },
    );
  }
}

import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
  type WorkflowStepContext,
} from "cloudflare:workers";
import {
  assertOnboardingKycPayload,
  fetchOutboxQueuePayload,
} from "../lib/workflow-outbox";
import type { QueuePayload } from "../lib/side-effect-payload";
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

    const payload = await step.do(
      "load-onboarding-kyc-outbox",
      async (_ctx: WorkflowStepContext) => {
        const p = await fetchOutboxQueuePayload(outboxId);
        assertOnboardingKycPayload(p);
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
        return (await runOnboardingKycUpload(
          p.data as unknown as OnboardingKycUploadData,
        )) as never;
      },
    );
  }
}

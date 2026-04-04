import tanstackApp from "@tanstack/react-start/server-entry";
import { handleAsyncJobQueue } from "./lib/queues/consume";
export { OnboardingKycWorkflow } from "./workflows/onboarding-kyc-workflow";

export default Object.assign(tanstackApp, {
  queue: handleAsyncJobQueue,
});

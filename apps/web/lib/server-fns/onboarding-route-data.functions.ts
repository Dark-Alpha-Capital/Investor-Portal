import { createServerFn } from "@tanstack/react-start";
import * as impl from "./onboarding-route-data.server";

export const fetchOnboardingPageData = createServerFn({ method: "GET" }).handler(
  () => impl.runFetchOnboardingPageData(),
);

export const fetchOnboardingEditPageData = createServerFn({
  method: "GET",
}).handler(() => impl.runFetchOnboardingEditPageData());

export const fetchProfileEditOnboardingData = createServerFn({
  method: "GET",
}).handler(() => impl.runFetchProfileEditOnboardingData());

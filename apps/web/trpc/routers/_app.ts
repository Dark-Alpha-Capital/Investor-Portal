import { userRouter } from "./user";
import { authRouter } from "./auth";
import { dealsRouter } from "./deals";
import { onboardingRouter } from "./onboarding";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  deals: dealsRouter,
  onboarding: onboardingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

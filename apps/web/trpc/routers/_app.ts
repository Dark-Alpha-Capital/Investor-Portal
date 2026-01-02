import { userRouter } from "./user";
import { authRouter } from "./auth";
import { dealsRouter } from "./deals";
import { onboardingRouter } from "./onboarding";
import { adminRouter } from "./admin";
import { investmentsRouter } from "./investments";
import { complianceRouter } from "./compliance";
import { ticketsRouter } from "./tickets";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  deals: dealsRouter,
  onboarding: onboardingRouter,
  admin: adminRouter,
  investments: investmentsRouter,
  compliance: complianceRouter,
  tickets: ticketsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

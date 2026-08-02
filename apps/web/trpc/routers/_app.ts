import { userRouter } from "./user";
import { authRouter } from "./auth";
import { dealsRouter } from "./deals";
import { onboardingRouter } from "./onboarding";
import { adminRouter } from "./admin";
import { investmentsRouter } from "./investments";
import { complianceRouter } from "./compliance";
import { knowledgeRequestsRouter } from "./knowledge-requests";
import { subscriptionClosingRouter } from "./subscription-closing";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  deals: dealsRouter,
  onboarding: onboardingRouter,
  admin: adminRouter,
  investments: investmentsRouter,
  compliance: complianceRouter,
  knowledgeRequests: knowledgeRequestsRouter,
  subscriptionClosing: subscriptionClosingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

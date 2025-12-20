import { userRouter } from "./user";
import { authRouter } from "./auth";
import { dealsRouter } from "./deals";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  deals: dealsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

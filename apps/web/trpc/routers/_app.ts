import { userRouter } from "./user";
import { authRouter } from "./auth";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
}) as ReturnType<typeof createTRPCRouter>;
// export type definition of API
export type AppRouter = typeof appRouter;

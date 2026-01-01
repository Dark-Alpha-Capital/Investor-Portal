import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";

export const userRouter = createTRPCRouter({
  /**
   * Public example: uses `ctx.db` from context but does not require auth.
   */
  list: baseProcedure.query(async ({ ctx }) => {
    // Example: read from DB (replace with your real query)
    // const users = await ctx.db.query.users.findMany();
    // return users;
    return {
      hasDb: Boolean(ctx.db),
    };
  }),

  /**
   * Public example with input validation.
   */
  byId: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Example: look up a user by ID
      // return ctx.db.query.users.findFirst({ where: { id: input.id } });
      return {
        id: input.id,
      };
    }),
});

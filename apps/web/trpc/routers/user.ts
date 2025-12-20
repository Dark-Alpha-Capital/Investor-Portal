import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

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

  /**
   * Protected example: shows how `ctx.session` and `ctx.userId` are available
   * after the auth middleware runs.
   */
  me: protectedProcedure.query(({ ctx }) => {
    return {
      userId: ctx.userId,
      user: ctx.session?.user,
    };
  }),

  /**
   * Example mutation with input validation.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Example: write to DB as the authenticated user
      // const user = await ctx.db.insert(users).values({
      //   name: input.name,
      //   email: input.email,
      // });
      // return user;
      return {
        createdBy: ctx.userId,
        ...input,
      };
    }),
});

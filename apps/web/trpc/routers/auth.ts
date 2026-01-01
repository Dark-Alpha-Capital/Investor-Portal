import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "../init";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

export const authRouter = createTRPCRouter({
  /**
   * Get current session
   */
  getSession: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to get session",
      });
    }
    return {
      session: session,
      user: session.user,
    };
  }),

  /**
   * Check if email is verified
   */
  checkEmailVerification: baseProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const foundUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
        columns: {
          id: true,
          email: true,
          emailVerified: true,
        },
      });

      return {
        exists: !!foundUser,
        emailVerified: foundUser?.emailVerified ?? false,
      };
    }),
});

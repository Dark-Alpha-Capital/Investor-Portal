import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "../init";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { authSession } from "@/lib/auth-session-from-request";

export const authRouter = createTRPCRouter({
  /**
   * Get current session
   */
  getSession: baseProcedure.query(async ({ ctx }) => {
    const session = await authSession();
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

      const foundUser = await ctx.db.select().from(user).where(eq(user.email, input.email)).limit(1);
      if (!foundUser) {
        return {
          exists: false,
          emailVerified: false,
        };
      }


      return {
        exists: !!foundUser,
        emailVerified: foundUser[0]?.emailVerified ?? false,
      };
    }),
});

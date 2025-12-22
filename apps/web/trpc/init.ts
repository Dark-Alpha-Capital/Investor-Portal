import { auth } from "@/auth";
import { TRPCError, initTRPC } from "@trpc/server";
import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@repo/db";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  /**
   * This runs once per incoming request and its return value
   * becomes `ctx` inside every procedure.
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    db,
    session,
    userId: session?.user.id ?? null,
  };
});

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  /**
   * Data transformer so complex values like Date, Map, etc.
   * round-trip correctly between server and client.
   */
  transformer: superjson,
  /**
   * Customize the error shape the client receives.
   * Here we just forward the default shape.
   */
  errorFormatter({ shape }) {
    return shape;
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

/**
 * Procedure that requires a logged-in user.
 * It narrows `ctx.session` and `ctx.userId` to non-null.
 */
export const protectedProcedure: typeof baseProcedure = baseProcedure.use(
  ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        userId: ctx.userId!,
      },
    });
  }
);

/**
 * Procedure that requires a logged-in admin user.
 * It extends protectedProcedure and checks for admin role.
 */
export const adminProcedure: typeof protectedProcedure = protectedProcedure.use(
  ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can perform this action",
      });
    }

    const user = ctx.session.user as typeof ctx.session.user & {
      role?: string | null;
    };

    if (user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can perform this action",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        userId: ctx.userId!,
      },
    });
  }
);

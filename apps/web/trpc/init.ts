import { TRPCError, initTRPC } from "@trpc/server";
import { cache } from "react";
import { db } from "@repo/db";
import superjson from "superjson";
import { authSession } from "@/app/(auth)/auth";

export const createTRPCContext = cache(async () => {
  const session = await authSession();

  return {
    db,
    session,
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

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

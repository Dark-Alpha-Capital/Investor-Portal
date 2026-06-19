import { TRPCError, initTRPC } from "@trpc/server";
import { db } from "@repo/db";
import superjson from "superjson";
import { authSessionFromHeaders } from "@/lib/auth-session";
import type { Session } from "@/lib/session-types";

/** Session guaranteed non-null with a user (set by `enforceUserIsAuthed`). */
export type SessionWithUser = Exclude<Session, null>;

export async function createTRPCContext(opts: { req: Request }) {
  const session = await authSessionFromHeaders(opts.req.headers);

  return {
    db,
    session,
  };
}

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
  const session = ctx.session;
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: session as SessionWithUser,
    },
  });
});

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  const session = ctx.session;
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: session as SessionWithUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

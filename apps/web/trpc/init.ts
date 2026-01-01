import { auth } from "@/auth";
import { TRPCError, initTRPC } from "@trpc/server";
import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@repo/db";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  return {
    db,
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

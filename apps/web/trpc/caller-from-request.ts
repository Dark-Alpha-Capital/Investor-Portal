import "@tanstack/react-start/server-only";
import { getRequest } from "@tanstack/react-start/server";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

/** tRPC server caller bound to the current HTTP request (loaders, server routes). */
export async function getTrpcCaller() {
  const ctx = await createTRPCContext({ req: getRequest() });
  return appRouter.createCaller(ctx);
}

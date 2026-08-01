import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { makeQueryClient } from "./trpc/query-client";

export type RouterContext = {
  queryClient: QueryClient;
};

export function getRouter() {
  const queryClient = makeQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

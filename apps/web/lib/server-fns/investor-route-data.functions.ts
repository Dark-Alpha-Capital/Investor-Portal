import { createServerFn } from "@tanstack/react-start";
import {
  dealIdInputSchema,
  routeSearchStringSchema,
} from "@/lib/schemas/server-fn/inputs";
import * as impl from "./investor-route-data.server";

export const fetchSessionForDashboardLayout = createServerFn({ method: "GET" }).handler(
  () => impl.runFetchSessionForDashboardLayout(),
);

export const fetchDashboardRouteData = createServerFn({ method: "GET" }).handler(() =>
  impl.runFetchDashboardRouteData(),
);

export const fetchMarketplaceDealsRouteData = createServerFn({ method: "GET" })
  .inputValidator((input) => routeSearchStringSchema.parse(input))
  .handler(({ data }) => impl.runFetchMarketplaceDealsRouteData(data));

export const fetchDealDetailRouteData = createServerFn({ method: "GET" })
  .inputValidator((input) => dealIdInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchDealDetailRouteData(data));

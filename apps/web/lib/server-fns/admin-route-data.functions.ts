import { createServerFn } from "@tanstack/react-start";
import { adminOnlyServerFnMiddleware } from "@/lib/middleware/admin-only-server-fn";
import {
  dealIdInputSchema,
  investorIdInputSchema,
  routeSearchStringSchema,
} from "@/lib/schemas/server-fn/inputs";
import * as impl from "./admin-route-data.server";

export const fetchAdminHomePageData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => routeSearchStringSchema.parse(input))
  .handler(({ data }) => impl.runFetchAdminHomePageData(data));

export const fetchAdminDealsListData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => routeSearchStringSchema.parse(input))
  .handler(({ data }) => impl.runFetchAdminDealsListData(data));

export const fetchAdminDealDetailData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => dealIdInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchAdminDealDetailData(data));

export const fetchAdminDealEditData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => dealIdInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchAdminDealEditData(data));

export const fetchAdminDealCurateData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => dealIdInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchAdminDealCurateData(data));

export const fetchComplianceListData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => routeSearchStringSchema.parse(input))
  .handler(({ data }) => impl.runFetchComplianceListData(data));

export const fetchComplianceInvestorData = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((input) => investorIdInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchComplianceInvestorData(data));

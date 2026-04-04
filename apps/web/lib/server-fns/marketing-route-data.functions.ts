import { createServerFn } from "@tanstack/react-start";
import {
  investmentTypePageInputSchema,
  sectorPageInputSchema,
} from "@/lib/schemas/server-fn/inputs";
import * as impl from "./marketing-route-data.server";

export const fetchSectorPagePayload = createServerFn({ method: "GET" })
  .inputValidator((input) => sectorPageInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchSectorPagePayload(data));

export const fetchInvestmentTypePagePayload = createServerFn({
  method: "GET",
})
  .inputValidator((input) => investmentTypePageInputSchema.parse(input))
  .handler(({ data }) => impl.runFetchInvestmentTypePagePayload(data));

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { adminOnlyServerFnMiddleware } from "@/lib/middleware/admin-only-server-fn";
import { getPendingInvestors } from "@repo/db/queries";

export const complianceListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  clearanceStatus: z.string().optional(),
});

export type ComplianceListSearch = z.infer<typeof complianceListSearchSchema>;

export type ComplianceListData = Awaited<
  ReturnType<typeof getPendingInvestors>
>;

const PAGE_SIZE = 12;

export const loadComplianceList = createServerFn({ method: "GET" })
  .middleware([adminOnlyServerFnMiddleware])
  .validator((data: unknown) => complianceListSearchSchema.parse(data))
  .handler(async ({ data: deps }): Promise<ComplianceListData> => {
    const clearanceStatus =
      deps.clearanceStatus && deps.clearanceStatus !== "all"
        ? deps.clearanceStatus
        : undefined;

    return getPendingInvestors({
      page: deps.page ?? 1,
      limit: PAGE_SIZE,
      search: deps.search?.trim() || undefined,
      clearanceStatus,
    });
  });

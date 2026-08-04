import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { authSession } from "@/lib/auth/session-from-request";
import { getMyInvestments } from "@repo/db/queries";

export const myInvestmentsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type MyInvestmentsSearch = z.infer<typeof myInvestmentsSearchSchema>;

export type MyInvestmentsData = Awaited<
  ReturnType<typeof getMyInvestments>
>;

const PAGE_SIZE = 10;

export function normalizeMyInvestmentsDeps(search: MyInvestmentsSearch) {
  return {
    page: search.page ?? 1,
    search: search.search?.trim() || undefined,
    status:
      search.status && search.status !== "all" ? search.status : undefined,
  };
}

export const loadMyInvestments = createServerFn({ method: "GET" })
  .validator((data: unknown) => myInvestmentsSearchSchema.parse(data))
  .handler(async ({ data: deps }): Promise<MyInvestmentsData> => {
    const session = await authSession();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const normalized = normalizeMyInvestmentsDeps(deps);

    return getMyInvestments({
      userId: session.user.id,
      page: normalized.page,
      limit: PAGE_SIZE,
      search: normalized.search,
      status: normalized.status,
    });
  });

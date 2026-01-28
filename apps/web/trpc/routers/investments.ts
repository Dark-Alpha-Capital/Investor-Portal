import { TRPCError } from "@trpc/server";
import { investmentDocument, investment, deal } from "@repo/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";
import { eq, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { z } from "zod";

export const investmentsRouter = createTRPCRouter({
  getDocuments: baseProcedure
    .input(
      z
        .object({
          investmentId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const session = await getSession();

      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view documents",
        });
      }

      // Build where conditions - only get documents for investments owned by this user
      const whereConditions = [eq(investment.userId, session.user.id)];

      // Filter by specific investment if provided
      if (input?.investmentId) {
        whereConditions.push(
          eq(investmentDocument.investmentId, input.investmentId)
        );
      }

      // Build query - only get documents for investments owned by this user
      const documents = await ctx.db
        .select({
          id: investmentDocument.id,
          investmentId: investmentDocument.investmentId,
          documentType: investmentDocument.documentType,
          fileName: investmentDocument.fileName,
          fileSize: investmentDocument.fileSize,
          fileType: investmentDocument.fileType,
          fileUrl: investmentDocument.fileUrl,
          periodStart: investmentDocument.periodStart,
          periodEnd: investmentDocument.periodEnd,
          year: investmentDocument.year,
          uploadedAt: investmentDocument.uploadedAt,
          createdAt: investmentDocument.createdAt,
          dealName: deal.name,
          dealId: deal.id,
        })
        .from(investmentDocument)
        .innerJoin(
          investment,
          eq(investmentDocument.investmentId, investment.id)
        )
        .innerJoin(deal, eq(investment.dealId, deal.id))
        .where(and(...whereConditions))
        .orderBy(desc(investmentDocument.uploadedAt));

      return documents;
    }),
});

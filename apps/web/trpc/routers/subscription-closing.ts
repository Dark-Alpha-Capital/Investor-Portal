import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { investment } from "@repo/db/schema";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { assertCanAccessInvestment } from "@/lib/closing/permissions";
import {
  cancelCommitment,
  getClosingPackageForInvestment,
  rejectCommitment,
  resolveEntitySnapshot,
} from "@/lib/closing/services/investment-closing-service";
import {
  generatePackage,
  getDocumentDownloadPath,
  uploadReplacementPdf,
} from "@/lib/closing/services/package-service";
import {
  countersignDocument,
  markDocumentViewed,
  sendForSignature,
  signDocument,
} from "@/lib/closing/services/signature-service";

function toTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  const message =
    error instanceof Error ? error.message : "Subscription closing error";
  if (message === "Forbidden") {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
  if (message.toLowerCase().includes("not found")) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
  if (
    message.includes("Cannot") ||
    message.includes("Illegal") ||
    message.includes("must be") ||
    message.includes("does not require") ||
    message.includes("No signature") ||
    message.includes("Missing template")
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: error,
  });
}

export const subscriptionClosingRouter = createTRPCRouter({
  getEntitySnapshot: protectedProcedure.query(async ({ ctx }) => {
    return resolveEntitySnapshot(ctx.db, ctx.session.user.id);
  }),

  getPackage: protectedProcedure
    .input(z.object({ investmentId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";
      try {
        await assertCanAccessInvestment(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
          isAdmin,
        );
      } catch (error) {
        toTrpcError(error);
      }

      const [inv] = await ctx.db
        .select()
        .from(investment)
        .where(eq(investment.id, input.investmentId))
        .limit(1);

      const closing = await getClosingPackageForInvestment(
        ctx.db,
        input.investmentId,
      );

      return {
        investment: inv,
        package: closing?.package ?? null,
        documents: closing?.documents ?? [],
        events: closing?.events ?? [],
        history: closing?.history ?? [],
      };
    }),

  getPackageByDeal: protectedProcedure
    .input(z.object({ dealId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";
      const rows = await ctx.db
        .select()
        .from(investment)
        .where(eq(investment.dealId, input.dealId));

      const owned =
        rows.find((row) => row.userId === ctx.session.user.id) ?? null;

      if (!owned) {
        return null;
      }

      if (!isAdmin && owned.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      }

      const closing = await getClosingPackageForInvestment(ctx.db, owned.id);
      return {
        investment: owned,
        package: closing?.package ?? null,
        documents: closing?.documents ?? [],
        events: closing?.events ?? [],
        history: closing?.history ?? [],
      };
    }),

  generateDocuments: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        regenerate: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await generatePackage(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
          { regenerate: input.regenerate },
        );
        return { success: true, ...result };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  uploadReplacement: adminProcedure
    .input(
      z.object({
        documentId: z.string().min(1),
        fileName: z.string().min(1),
        fileData: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const bytes = Uint8Array.from(atob(input.fileData), (c) =>
          c.charCodeAt(0),
        );
        const doc = await uploadReplacementPdf(ctx.db, {
          documentId: input.documentId,
          actorUserId: ctx.session.user.id,
          fileName: input.fileName,
          bytes,
        });
        return { success: true, document: doc };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  sendForSignature: adminProcedure
    .input(z.object({ investmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await sendForSignature(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
        );
        return { success: true };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  markViewed: protectedProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await markDocumentViewed(
          ctx.db,
          input.documentId,
          ctx.session.user.id,
        );
        return { success: true };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  signDocument: protectedProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await signDocument(
          ctx.db,
          input.documentId,
          ctx.session.user.id,
          ctx.session.user.role === "admin",
        );
        return { success: true };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  countersignDocument: adminProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await countersignDocument(
          ctx.db,
          input.documentId,
          ctx.session.user.id,
        );
        return { success: true };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";
      try {
        const row = await assertCanAccessInvestment(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
          isAdmin,
        );
        // Investors may cancel only early statuses
        if (
          !isAdmin &&
          row.status !== "draft" &&
          row.status !== "pending_documents"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only cancel before documents are generated",
          });
        }
        const updated = await cancelCommitment(
          ctx.db,
          input.investmentId,
          {
            userId: ctx.session.user.id,
            role: isAdmin ? "admin" : "investor",
          },
          input.reason,
        );
        return { success: true, investment: updated };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  reject: adminProcedure
    .input(
      z.object({
        investmentId: z.string().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await rejectCommitment(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
          input.reason,
        );
        return { success: true, investment: updated };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  getDownloadUrl: protectedProcedure
    .input(
      z.object({
        documentId: z.string().min(1),
        kind: z.enum(["pdf", "signed", "html"]).default("pdf"),
        investmentId: z.string().min(1),
        preview: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";
      try {
        await assertCanAccessInvestment(
          ctx.db,
          input.investmentId,
          ctx.session.user.id,
          isAdmin,
        );
      } catch (error) {
        toTrpcError(error);
      }

      const path = await getDocumentDownloadPath(
        ctx.db,
        input.documentId,
        input.kind,
      );
      if (!path) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document file not found",
        });
      }

      // Portal-proxied URL (Nextcloud direct links require NC cookies → Strict Cookie error).
      const qs = new URLSearchParams({
        documentId: input.documentId,
        investmentId: input.investmentId,
        kind: input.kind,
        ...(input.preview ? { preview: "1" } : {}),
      });
      return {
        path,
        downloadUrl: `/api/subscription-documents/download?${qs.toString()}`,
      };
    }),
});

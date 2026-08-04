import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  closeKnowledgeRequest,
  createKnowledgeRequest,
  getDealNameById,
  getKnowledgeRequestById,
  listAdminUserEmails,
  listKnowledgeRequestsByDeal,
  nextKnowledgeReferenceCode,
  publishKnowledgeAnswer,
  searchDealKnowledge,
} from "@repo/db/queries";
import {
  EMAIL_CONFIG,
  type KnowledgeRequestAdminJobData,
  type KnowledgeRequestAnsweredJobData,
} from "@repo/mail";
import {
  logKnowledgeRequestAnswered,
  logKnowledgeRequestClosed,
  logKnowledgeRequestCreated,
} from "@/lib/audit";
import { getDealPermissions } from "@/lib/auth/permissions";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import { enqueueEmail } from "@/lib/queues/enqueue";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../init";

const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_CONFIG.defaultAdminEmail;

function appBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.VITE_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

export const knowledgeRequestsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        chatId: z.string().min(1).optional().nullable(),
        title: z.string().trim().min(1).max(200),
        question: z.string().trim().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const isAdmin = isAdminUser(user);

      if (!isAdmin) {
        const permissions = await getDealPermissions(user.id, input.dealId);
        if (!permissions?.hasPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this deal",
          });
        }
      }

      const dealName = await getDealNameById(input.dealId);
      if (!dealName) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const id = randomUUID();
      const referenceCode = await nextKnowledgeReferenceCode();

      const row = await createKnowledgeRequest({
        id,
        dealId: input.dealId,
        askedByUserId: user.id,
        chatId: input.chatId ?? null,
        referenceCode,
        title: input.title,
        question: input.question,
      });

      await logKnowledgeRequestCreated({
        performedBy: user.id,
        requestId: id,
        dealId: input.dealId,
        referenceCode,
        chatId: input.chatId,
      });

      const adminUrl = `${appBaseUrl()}/admin/deals/${input.dealId}?tab=questions`;
      const adminRecipients = await listAdminUserEmails();
      const recipientEmails = new Set<string>(
        adminRecipients.map((a) => a.email).filter(Boolean),
      );
      recipientEmails.add(ADMIN_NOTIFICATION_EMAIL);

      const emailJobs = [...recipientEmails].map((to) => {
        const data: KnowledgeRequestAdminJobData = {
          type: "knowledge-request-admin",
          to,
          dealName,
          investorName: user.name || "Investor",
          investorEmail: user.email || "",
          referenceCode,
          title: input.title,
          question: input.question,
          adminUrl,
        };
        return {
          dedupeKey: `knowledge-request:admin:${id}:${to}`,
          jobName: "knowledge-request-admin",
          jobId: `knowledge-request-admin-${id}-${to.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
          data,
        };
      });

      if (emailJobs.length > 0) {
        await enqueueEmail(ctx.db, emailJobs);
      }

      return {
        success: true as const,
        request: row,
        referenceCode,
      };
    }),

  listByDeal: adminProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        status: z
          .enum(["open", "answered", "closed", "archived"])
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const requests = await listKnowledgeRequestsByDeal({
        dealId: input.dealId,
        status: input.status,
      });
      return { success: true as const, requests };
    }),

  get: adminProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .query(async ({ input }) => {
      const request = await getKnowledgeRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge request not found",
        });
      }
      return { success: true as const, request };
    }),

  generateDraft: adminProcedure
    .input(
      z.object({
        dealId: z.string().min(1),
        question: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await searchDealKnowledge({
        dealId: input.dealId,
        query: input.question,
        includeDocuments: true,
      });

      if (!result.found) {
        return {
          success: true as const,
          draft:
            "No verified sources found in deal knowledge. Please draft an answer from diligence materials.",
          hits: [] as typeof result.hits,
        };
      }

      const lines = result.hits.map((hit, index) => {
        const sourceLabel =
          hit.source === "verified_answer"
            ? `Verified answer${hit.referenceCode ? ` (${hit.referenceCode})` : ""}`
            : hit.source === "deal_field"
              ? `Deal field: ${hit.title}`
              : `Document: ${hit.title}`;
        return `${index + 1}. ${sourceLabel}\n${hit.snippet}`;
      });

      const draft = [
        "Based on available deal knowledge:",
        "",
        ...lines,
        "",
        "Please review and edit before publishing.",
      ].join("\n");

      return { success: true as const, draft, hits: result.hits };
    }),

  publishAnswer: adminProcedure
    .input(
      z.object({
        requestId: z.string().min(1),
        answer: z.string().trim().min(1).max(20000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getKnowledgeRequestById(input.requestId);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge request not found",
        });
      }
      if (existing.status !== "open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only open requests can be answered",
        });
      }

      const answerId = randomUUID();
      const updated = await publishKnowledgeAnswer({
        answerId,
        requestId: input.requestId,
        answer: input.answer,
        answeredByUserId: ctx.session.user.id,
      });

      await logKnowledgeRequestAnswered({
        performedBy: ctx.session.user.id,
        requestId: input.requestId,
        dealId: existing.dealId,
        referenceCode: existing.referenceCode,
      });

      const dealName =
        (await getDealNameById(existing.dealId)) ?? "the deal";
      const chatUrl = existing.chatId
        ? `${appBaseUrl()}/chat/${existing.chatId}`
        : `${appBaseUrl()}/deals/${existing.dealId}`;

      const investorEmailPayload: KnowledgeRequestAnsweredJobData = {
        type: "knowledge-request-answered",
        to: existing.askerEmail,
        investorName: existing.askerName,
        dealName,
        referenceCode: existing.referenceCode,
        title: existing.title,
        answerPreview: input.answer.slice(0, 500),
        chatUrl,
      };

      await enqueueEmail(ctx.db, [
        {
          dedupeKey: `knowledge-request:answered:${input.requestId}`,
          jobName: "knowledge-request-answered",
          jobId: `knowledge-request-answered-${input.requestId}`,
          data: investorEmailPayload,
        },
      ]);

      return { success: true as const, request: updated };
    }),

  close: adminProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getKnowledgeRequestById(input.requestId);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge request not found",
        });
      }

      const updated = await closeKnowledgeRequest(input.requestId);
      await logKnowledgeRequestClosed({
        performedBy: ctx.session.user.id,
        requestId: input.requestId,
        dealId: existing.dealId,
        referenceCode: existing.referenceCode,
      });

      return { success: true as const, request: updated };
    }),
});

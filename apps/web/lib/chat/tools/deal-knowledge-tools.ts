import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { searchDealKnowledge } from "@repo/db/queries";
import { getDealPermissions } from "@/lib/auth/permissions";
import { serializeForToolResult } from "@/lib/chat/tools/serialize";

const NEEDS_DEAL_SELECTION = {
  code: "needs_deal_selection" as const,
  found: false,
  message:
    "No deal is selected for this chat. Ask the user to pick a deal from the Select deal control in the composer, then retry.",
};

export function createDealKnowledgeTools(options: {
  userId: string;
  dealId: string | null;
  isAdmin: boolean;
}) {
  const { userId, dealId, isAdmin } = options;

  async function ensureDealAccess(targetDealId: string) {
    if (isAdmin) {
      return { ok: true as const };
    }
    const permissions = await getDealPermissions(userId, targetDealId);
    if (!permissions?.hasPermission) {
      return {
        ok: false as const,
        message: "You do not have access to this deal.",
      };
    }
    return {
      ok: true as const,
      canViewDocuments: permissions.canViewDocuments,
    };
  }

  const searchDealKnowledgeTool = tool({
    description:
      "Search verified deal knowledge for the currently selected deal: published Q&A answers, deal fields (thesis, risks, financials), and document metadata. Always call this for deal-specific questions before answering. Never invent facts.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("The investor question or search phrase"),
    }),
    execute: async ({ query }) => {
      if (!dealId) {
        return serializeForToolResult(NEEDS_DEAL_SELECTION);
      }

      const access = await ensureDealAccess(dealId);
      if (!access.ok) {
        return serializeForToolResult({
          code: "forbidden",
          found: false,
          message: access.message,
        });
      }

      const includeDocuments = isAdmin || access.canViewDocuments !== false;
      const result = await searchDealKnowledge({
        dealId,
        query,
        includeDocuments,
      });

      return serializeForToolResult({
        code: result.found ? "ok" : "no_results",
        found: result.found,
        dealId,
        dealName: result.dealName,
        hits: result.hits,
        message: result.found
          ? undefined
          : "No verified knowledge found for this query. Do not invent an answer. Offer to escalate via proposeKnowledgeRequest.",
      });
    },
  });

  const proposeKnowledgeRequestTool = tool({
    description:
      "Propose submitting a knowledge request to the deal team when searchDealKnowledge finds no verified answer. Does not create the request — the client shows Confirm/Submit UI. Never invent an answer instead of proposing escalation.",
    inputSchema: z.object({
      title: z
        .string()
        .min(1)
        .max(200)
        .describe("Short title for the question"),
      question: z
        .string()
        .min(1)
        .max(4000)
        .describe("Full question to send to the deal team"),
    }),
    execute: async ({ title, question }) => {
      if (!dealId) {
        return serializeForToolResult(NEEDS_DEAL_SELECTION);
      }

      const access = await ensureDealAccess(dealId);
      if (!access.ok) {
        return serializeForToolResult({
          code: "forbidden",
          message: access.message,
        });
      }

      return serializeForToolResult({
        code: "awaiting_confirmation",
        dealId,
        title,
        question,
        message:
          "Show the investor Submit Question / Cancel controls. Do not claim the question was submitted until they confirm.",
      });
    },
  });

  return {
    searchDealKnowledge: searchDealKnowledgeTool,
    proposeKnowledgeRequest: proposeKnowledgeRequestTool,
  } satisfies ToolSet;
}

import { chatbotTools } from "@repo/ai-core";
import type { ToolSet } from "ai";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import type { Session } from "@/lib/auth/session-types";
import { createAdminChatTools } from "@/lib/chat/tools/admin-tools";
import { createDealKnowledgeTools } from "@/lib/chat/tools/deal-knowledge-tools";
import { createMarketplaceChatTools } from "@/lib/chat/tools/marketplace-tools";

type SessionUser = NonNullable<Session>["user"];

export function getChatToolsForUser(
  user: SessionUser,
  options?: { dealId?: string | null },
): ToolSet {
  const isAdmin = isAdminUser(user);
  const dealId = options?.dealId ?? null;

  return {
    ...chatbotTools,
    ...createMarketplaceChatTools({ userId: user.id }),
    ...createDealKnowledgeTools({
      userId: user.id,
      dealId,
      isAdmin,
    }),
    ...(isAdmin ? createAdminChatTools({ isAdmin: true }) : {}),
  };
}

export function getChatToolInstructions(
  user: SessionUser,
  options?: { dealId?: string | null; dealName?: string | null },
): string {
  const isAdmin = isAdminUser(user);
  const dealBound = Boolean(options?.dealId);
  const dealLabel = options?.dealName
    ? `"${options.dealName}"`
    : options?.dealId
      ? `deal ${options.dealId}`
      : null;

  const shared = `Available data tools:
- listMarketplaceDeals: list deals currently visible in the marketplace for this user. Use it for marketplace / available deals questions. Summarize results clearly; do not invent deals.
- searchDealKnowledge: search verified knowledge for the deal currently bound to this chat (published Q&A, deal fields, document metadata). Always call this for deal-specific questions before answering. Never invent deal facts.
- proposeKnowledgeRequest: when searchDealKnowledge returns no results, propose escalating the question to the deal team. This does NOT submit the question — the client shows Submit/Cancel. Never auto-create a request.`;

  const dealContext = dealBound
    ? `This chat is bound to deal ${dealLabel}. Use searchDealKnowledge for deal questions; do not ask which deal.`
    : `No deal is bound to this chat yet. If the user asks a deal-specific question, call searchDealKnowledge (it will return needs_deal_selection) and tell them to pick a deal using the Select deal control in the composer.`;

  if (!isAdmin) {
    return `${shared}

${dealContext}

You are chatting with an investor. Do not claim access to other investors' data. Admin-only investor roster/detail tools are not available.`;
  }

  return `${shared}
- listInvestors: admin-only. Count/list registered investors and who currently has an active login session.
- getInvestorDetails: admin-only. Full investor profile including onboarding/KYC, clearance, deal interest, and investments. Look up by id, email, or name.

${dealContext}

You are chatting with an admin. Prefer these tools over guessing when asked about investors or portal headcount.`;
}

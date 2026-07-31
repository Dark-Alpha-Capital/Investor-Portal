import { chatbotTools } from "@repo/ai-core";
import type { ToolSet } from "ai";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import type { Session } from "@/lib/auth/session-types";
import { createAdminChatTools } from "@/lib/chat/tools/admin-tools";
import { createMarketplaceChatTools } from "@/lib/chat/tools/marketplace-tools";

type SessionUser = NonNullable<Session>["user"];

export function getChatToolsForUser(user: SessionUser): ToolSet {
  const isAdmin = isAdminUser(user);

  return {
    ...chatbotTools,
    ...createMarketplaceChatTools({ userId: user.id }),
    ...(isAdmin ? createAdminChatTools({ isAdmin: true }) : {}),
  };
}

export function getChatToolInstructions(user: SessionUser): string {
  const isAdmin = isAdminUser(user);

  const shared = `Available data tools:
- listMarketplaceDeals: list deals currently visible in the marketplace for this user. Use it for marketplace / available deals questions. Summarize results clearly; do not invent deals.`;

  if (!isAdmin) {
    return `${shared}

You are chatting with an investor. Do not claim access to other investors' data. Admin-only investor roster/detail tools are not available.`;
  }

  return `${shared}
- listInvestors: admin-only. Count/list registered investors and who currently has an active login session.
- getInvestorDetails: admin-only. Full investor profile including onboarding/KYC, clearance, deal interest, and investments. Look up by id, email, or name.

You are chatting with an admin. Prefer these tools over guessing when asked about investors or portal headcount.`;
}

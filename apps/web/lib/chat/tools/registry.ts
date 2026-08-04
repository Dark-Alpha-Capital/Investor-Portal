import type { ToolSet } from "ai";
import { chatbotTools } from "@repo/ai-core";
import { createMarketplaceChatTools } from "@/lib/chat/tools/marketplace-tools";
import { createDealKnowledgeTools } from "@/lib/chat/tools/deal-knowledge-tools";
import { createAdminChatTools } from "@/lib/chat/tools/admin-tools";

/**
 * The complete tool registry — every tool the chat can surface, regardless of
 * role. `ChatbotUITools` is derived from this single object, so the UI message
 * type always covers the tool parts the client renders.
 *
 * The *runtime* toolset for a request is a permissioned subset assembled by
 * `getChatToolsForUser`; this registry is the static superset used for typing.
 */
export const chatTools = {
  ...chatbotTools,
  ...createMarketplaceChatTools({ userId: "registry" }),
  ...createDealKnowledgeTools({
    userId: "registry",
    dealId: null,
    isAdmin: true,
  }),
  ...createAdminChatTools({ isAdmin: true }),
} satisfies ToolSet;

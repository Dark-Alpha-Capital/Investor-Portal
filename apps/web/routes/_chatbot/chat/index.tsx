import { createFileRoute, redirect } from "@tanstack/react-router";
import { createChatFn, type CreateChatFetchResult } from "@/lib/server-fns/chatbot-route-data";
import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";

export const Route = createFileRoute("/_chatbot/chat/")({
  beforeLoad: async () => {
    const result = (await createChatFn({
      data: { model: DEFAULT_CHAT_MODEL_ID },
    })) as CreateChatFetchResult;
    if (result.tag === "redirect") {
      throw redirect({ to: result.to });
    }
    throw redirect({
      to: "/chat/$chatId",
      params: { chatId: result.chatId },
    });
  },
});

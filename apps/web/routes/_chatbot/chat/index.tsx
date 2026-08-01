import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  createChatFn,
  type CreateChatFetchResult,
} from "@/lib/server-fns/chatbot-route-data";
import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";
import { z } from "zod";

const chatSearchSchema = z.object({
  dealId: z.string().trim().min(1).optional(),
});

export const Route = createFileRoute("/_chatbot/chat/")({
  validateSearch: (search) => chatSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    const result = (await createChatFn({
      data: {
        model: DEFAULT_CHAT_MODEL_ID,
        dealId: search.dealId ?? null,
      },
    })) as CreateChatFetchResult;

    if (result.tag === "redirect") {
      throw redirect({ to: result.to });
    }
    if (result.tag === "forbidden") {
      throw redirect({ to: "/chat" });
    }
    throw redirect({
      to: "/chat/$chatId",
      params: { chatId: result.chatId },
    });
  },
});

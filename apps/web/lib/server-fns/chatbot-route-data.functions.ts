import { createServerFn } from "@tanstack/react-start";
import {
  chatIdInputSchema,
  createChatInputSchema,
  setChatDealInputSchema,
} from "@/lib/schemas/server-fn/chat-inputs";
import * as impl from "./chatbot-route-data.server";
import type { ChatIdInput } from "@/lib/schemas/server-fn/chat-inputs";
import type { LoadChatFetchResult } from "./chatbot-route-data.server";

export const fetchSessionForChatbotLayout = createServerFn({
  method: "GET",
}).handler(() => impl.runFetchSessionForChatbotLayout());

export const fetchChatList = createServerFn({ method: "GET" }).handler(() =>
  impl.runListChats(),
);

export const createChatFn = createServerFn({ method: "POST" })
  .validator((input) => createChatInputSchema.parse(input))
  .handler(({ data }) => impl.runCreateChat(data));

async function loadChatHandler({
  data,
}: {
  data: ChatIdInput;
}): Promise<LoadChatFetchResult> {
  return impl.runLoadChat(data);
}

export const fetchChatById = createServerFn({ method: "GET" })
  .validator((input) => chatIdInputSchema.parse(input))
  // TanStack Start's serializable-return check is stricter than JSON allows
  // for the full UI message shape; the payload is plain JSON in practice.
  .handler(loadChatHandler as never);

export const setChatDealFn = createServerFn({ method: "POST" })
  .validator((input) => setChatDealInputSchema.parse(input))
  .handler(({ data }) => impl.runSetChatDeal(data) as never);

export const deleteChatFn = createServerFn({ method: "POST" })
  .validator((input) => chatIdInputSchema.parse(input))
  .handler(({ data }) => impl.runDeleteChat(data));

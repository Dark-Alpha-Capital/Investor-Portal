import { createServerFn } from "@tanstack/react-start";
import {
  chatIdInputSchema,
  createChatInputSchema,
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
  // ChatbotUIMessage parts include `unknown` (e.g. dynamic-tool input) which
  // fails TanStack Start's serializable return check even though JSON is fine.
  .handler(loadChatHandler as never);

export const deleteChatFn = createServerFn({ method: "POST" })
  .validator((input) => chatIdInputSchema.parse(input))
  .handler(({ data }) => impl.runDeleteChat(data));

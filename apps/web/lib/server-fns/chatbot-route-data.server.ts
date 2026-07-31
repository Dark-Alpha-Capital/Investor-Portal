import { authSession } from "@/lib/auth/session-from-request";
import type { AuthedSession } from "@/lib/auth/route-auth";
import type { ChatIdInput, CreateChatInput } from "@/lib/schemas/server-fn/chat-inputs";
import {
  createChat,
  deleteChat,
  listChats,
  loadChat,
  type ChatListItem,
  type ChatRecord,
} from "@/lib/chat/chat-store";
import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";

export type ChatbotSessionGuardResult =
  | { tag: "ok"; session: AuthedSession }
  | { tag: "redirect"; to: "/login" };

export async function runFetchSessionForChatbotLayout(): Promise<ChatbotSessionGuardResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  return { tag: "ok", session: session as AuthedSession };
}

export type ChatListFetchResult =
  | { tag: "ok"; chats: ChatListItem[] }
  | { tag: "redirect"; to: "/login" };

export async function runListChats(): Promise<ChatListFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const chats = await listChats(session.user.id);
  return { tag: "ok", chats };
}

export type CreateChatFetchResult =
  | { tag: "ok"; chatId: string }
  | { tag: "redirect"; to: "/login" };

export async function runCreateChat(
  input: CreateChatInput,
): Promise<CreateChatFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const chatId = await createChat({
    userId: session.user.id,
    model: input.model ?? DEFAULT_CHAT_MODEL_ID,
  });

  return { tag: "ok", chatId };
}

export type LoadChatFetchResult =
  | { tag: "ok"; chat: ChatRecord }
  | { tag: "redirect"; to: "/login" | "/chat" }
  | { tag: "not_found" };

export async function runLoadChat(
  input: ChatIdInput,
): Promise<LoadChatFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const chat = await loadChat(input.chatId, session.user.id);
  if (!chat) {
    return { tag: "not_found" };
  }

  return { tag: "ok", chat };
}

export type DeleteChatFetchResult =
  | { tag: "ok" }
  | { tag: "redirect"; to: "/login" }
  | { tag: "not_found" };

export async function runDeleteChat(
  input: ChatIdInput,
): Promise<DeleteChatFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const deleted = await deleteChat(input.chatId, session.user.id);
  if (!deleted) {
    return { tag: "not_found" };
  }

  return { tag: "ok" };
}

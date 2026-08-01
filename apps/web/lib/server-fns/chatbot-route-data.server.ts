import { authSession } from "@/lib/auth/session-from-request";
import type { AuthedSession } from "@/lib/auth/route-auth";
import type {
  ChatIdInput,
  CreateChatInput,
  SetChatDealInput,
} from "@/lib/schemas/server-fn/chat-inputs";
import {
  createChat,
  deleteChat,
  listChats,
  loadChat,
  setChatDealId,
  type ChatListItem,
  type ChatRecord,
} from "@/lib/chat/chat-store";
import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";
import { getDealPermissions } from "@/lib/auth/permissions";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import { getDealNameById } from "@repo/db/queries";

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
  | { tag: "redirect"; to: "/login" }
  | { tag: "forbidden"; message: string };

async function assertDealAccess(
  userId: string,
  dealId: string,
  isAdmin: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isAdmin) {
    const name = await getDealNameById(dealId);
    if (!name) {
      return { ok: false, message: "Deal not found" };
    }
    return { ok: true };
  }

  const permissions = await getDealPermissions(userId, dealId);
  if (!permissions?.hasPermission) {
    return {
      ok: false,
      message: "You do not have access to this deal",
    };
  }
  return { ok: true };
}

export async function runCreateChat(
  input: CreateChatInput,
): Promise<CreateChatFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const dealId = input.dealId ?? null;
  if (dealId) {
    const access = await assertDealAccess(
      session.user.id,
      dealId,
      isAdminUser(session.user),
    );
    if (!access.ok) {
      return { tag: "forbidden", message: access.message };
    }
  }

  const chatId = await createChat({
    userId: session.user.id,
    model: input.model ?? DEFAULT_CHAT_MODEL_ID,
    dealId,
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

export type SetChatDealFetchResult =
  | { tag: "ok"; chat: ChatRecord }
  | { tag: "redirect"; to: "/login" }
  | { tag: "not_found" }
  | { tag: "forbidden"; message: string };

export async function runSetChatDeal(
  input: SetChatDealInput,
): Promise<SetChatDealFetchResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  if (input.dealId) {
    const access = await assertDealAccess(
      session.user.id,
      input.dealId,
      isAdminUser(session.user),
    );
    if (!access.ok) {
      return { tag: "forbidden", message: access.message };
    }
  }

  const chat = await setChatDealId({
    chatId: input.chatId,
    userId: session.user.id,
    dealId: input.dealId,
  });

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

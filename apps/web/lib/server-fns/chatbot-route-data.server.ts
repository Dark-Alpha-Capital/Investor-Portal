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
import { getDealNameById, getUserWithKycStatus } from "@repo/db/queries";

type ChatbotRedirectTo = "/login" | "/onboarding";

export type ChatbotSessionGuardResult =
  | { tag: "ok"; session: AuthedSession }
  | { tag: "redirect"; to: ChatbotRedirectTo };

/**
 * Chat requires a real DB user. Incomplete-onboarding investors are sent to
 * onboarding; admins may use chat without completing investor onboarding.
 * Prevents FK failures when a session cookie points at a missing user row.
 */
async function requireChatbotAccess(): Promise<ChatbotSessionGuardResult> {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const userData = await getUserWithKycStatus(session.user.id);
  if (!userData) {
    return { tag: "redirect", to: "/login" };
  }

  if (!isAdminUser(session.user) && !userData.isOnboardingCompleted) {
    return { tag: "redirect", to: "/onboarding" };
  }

  return { tag: "ok", session: session as AuthedSession };
}

export async function runFetchSessionForChatbotLayout(): Promise<ChatbotSessionGuardResult> {
  return requireChatbotAccess();
}

export type ChatListFetchResult =
  | { tag: "ok"; chats: ChatListItem[] }
  | { tag: "redirect"; to: ChatbotRedirectTo };

export async function runListChats(): Promise<ChatListFetchResult> {
  const access = await requireChatbotAccess();
  if (access.tag === "redirect") {
    return access;
  }

  const chats = await listChats(access.session.user.id);
  return { tag: "ok", chats };
}

export type CreateChatFetchResult =
  | { tag: "ok"; chatId: string }
  | { tag: "redirect"; to: ChatbotRedirectTo }
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
  const access = await requireChatbotAccess();
  if (access.tag === "redirect") {
    return access;
  }

  const session = access.session;
  const dealId = input.dealId ?? null;
  if (dealId) {
    const dealAccess = await assertDealAccess(
      session.user.id,
      dealId,
      isAdminUser(session.user),
    );
    if (!dealAccess.ok) {
      return { tag: "forbidden", message: dealAccess.message };
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
  | { tag: "redirect"; to: ChatbotRedirectTo | "/chat" }
  | { tag: "not_found" };

export async function runLoadChat(
  input: ChatIdInput,
): Promise<LoadChatFetchResult> {
  const access = await requireChatbotAccess();
  if (access.tag === "redirect") {
    return access;
  }

  const chat = await loadChat(input.chatId, access.session.user.id);
  if (!chat) {
    return { tag: "not_found" };
  }

  return { tag: "ok", chat };
}

export type SetChatDealFetchResult =
  | { tag: "ok"; chat: ChatRecord }
  | { tag: "redirect"; to: ChatbotRedirectTo }
  | { tag: "not_found" }
  | { tag: "forbidden"; message: string };

export async function runSetChatDeal(
  input: SetChatDealInput,
): Promise<SetChatDealFetchResult> {
  const access = await requireChatbotAccess();
  if (access.tag === "redirect") {
    return access;
  }

  const session = access.session;
  if (input.dealId) {
    const dealAccess = await assertDealAccess(
      session.user.id,
      input.dealId,
      isAdminUser(session.user),
    );
    if (!dealAccess.ok) {
      return { tag: "forbidden", message: dealAccess.message };
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
  | { tag: "redirect"; to: ChatbotRedirectTo }
  | { tag: "not_found" };

export async function runDeleteChat(
  input: ChatIdInput,
): Promise<DeleteChatFetchResult> {
  const access = await requireChatbotAccess();
  if (access.tag === "redirect") {
    return access;
  }

  const deleted = await deleteChat(input.chatId, access.session.user.id);
  if (!deleted) {
    return { tag: "not_found" };
  }

  return { tag: "ok" };
}

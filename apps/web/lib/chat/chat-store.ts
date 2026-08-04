import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";
import type { ChatbotUIMessage } from "@/lib/chat/message-types";
import { asChatbotMessages, titleFromMessages } from "@/lib/chat/message-utils";
import { and, desc, eq, db } from "@repo/db";
import { chat, deal } from "@repo/db/schema";
import { generateId } from "ai";

export { asChatbotMessages, titleFromMessages } from "@/lib/chat/message-utils";

export type ChatListItem = {
  id: string;
  title: string;
  model: string;
  dealId: string | null;
  dealName: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export type ChatRecord = {
  id: string;
  userId: string;
  dealId: string | null;
  dealName: string | null;
  title: string;
  model: string;
  messages: ChatbotUIMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export async function createChat({
  userId,
  model = DEFAULT_CHAT_MODEL_ID,
  dealId = null,
}: {
  userId: string;
  model?: string;
  dealId?: string | null;
}): Promise<string> {
  const id = generateId();

  await db.insert(chat).values({
    id,
    userId,
    dealId: dealId ?? null,
    title: "New chat",
    model,
    messages: [],
  });

  return id;
}

export async function listChats(userId: string): Promise<ChatListItem[]> {
  const rows = await db
    .select({
      id: chat.id,
      title: chat.title,
      model: chat.model,
      dealId: chat.dealId,
      dealName: deal.name,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
    })
    .from(chat)
    .leftJoin(deal, eq(chat.dealId, deal.id))
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt));

  return rows.map((row) => ({
    ...row,
    dealId: row.dealId ?? null,
    dealName: row.dealName ?? null,
  }));
}

export async function loadChat(
  id: string,
  userId: string,
): Promise<ChatRecord | null> {
  const [row] = await db
    .select({
      id: chat.id,
      userId: chat.userId,
      dealId: chat.dealId,
      dealName: deal.name,
      title: chat.title,
      model: chat.model,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
    .from(chat)
    .leftJoin(deal, eq(chat.dealId, deal.id))
    .where(and(eq(chat.id, id), eq(chat.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    dealId: row.dealId ?? null,
    dealName: row.dealName ?? null,
    title: row.title,
    model: row.model,
    messages: asChatbotMessages(row.messages),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function setChatDealId({
  chatId,
  userId,
  dealId,
}: {
  chatId: string;
  userId: string;
  dealId: string | null;
}): Promise<ChatRecord | null> {
  const existing = await loadChat(chatId, userId);
  if (!existing) {
    return null;
  }

  await db
    .update(chat)
    .set({
      dealId,
      updatedAt: new Date(),
    })
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)));

  return loadChat(chatId, userId);
}

export async function saveChat({
  chatId,
  userId,
  messages,
  title,
  model,
}: {
  chatId: string;
  userId: string;
  messages: ChatbotUIMessage[];
  title?: string;
  model?: string;
}): Promise<void> {
  const existing = await loadChat(chatId, userId);
  if (!existing) {
    throw new Error("Chat not found");
  }

  const nextTitle =
    title ??
    (existing.title === "New chat"
      ? (titleFromMessages(messages) ?? existing.title)
      : existing.title);

  await db
    .update(chat)
    .set({
      messages,
      title: nextTitle,
      ...(model ? { model } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)));
}

export async function deleteChat(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(chat)
    .where(and(eq(chat.id, id), eq(chat.userId, userId)))
    .returning({ id: chat.id });

  return result.length > 0;
}

import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";
import type { ChatbotUIMessage } from "@repo/ai-core";
import { and, desc, eq, db } from "@repo/db";
import { chat } from "@repo/db/schema";
import { generateId } from "ai";

export type ChatListItem = {
  id: string;
  title: string;
  model: string;
  updatedAt: Date;
  createdAt: Date;
};

export type ChatRecord = {
  id: string;
  userId: string;
  title: string;
  model: string;
  messages: ChatbotUIMessage[];
  createdAt: Date;
  updatedAt: Date;
};

function asChatbotMessages(value: unknown): ChatbotUIMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((message) => {
    const item = message as ChatbotUIMessage;
    return {
      ...item,
      metadata: undefined,
    };
  });
}

function titleFromMessages(messages: ChatbotUIMessage[]): string | null {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) {
    return null;
  }

  const text = firstUser.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join(" ");

  if (!text) {
    return null;
  }

  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

export async function createChat({
  userId,
  model = DEFAULT_CHAT_MODEL_ID,
}: {
  userId: string;
  model?: string;
}): Promise<string> {
  const id = generateId();

  await db.insert(chat).values({
    id,
    userId,
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
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
    })
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt));

  return rows;
}

export async function loadChat(
  id: string,
  userId: string,
): Promise<ChatRecord | null> {
  const [row] = await db
    .select()
    .from(chat)
    .where(and(eq(chat.id, id), eq(chat.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    model: row.model,
    messages: asChatbotMessages(row.messages),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
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

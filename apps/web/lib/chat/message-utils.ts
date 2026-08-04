import type { ChatbotUIMessage } from "@/lib/chat/message-types";

/** Strip runtime metadata from stored messages (kept lean for persistence). */
export function asChatbotMessages(value: unknown): ChatbotUIMessage[] {
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

/** Derive a chat title from the first user text part. */
export function titleFromMessages(messages: ChatbotUIMessage[]): string | null {
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

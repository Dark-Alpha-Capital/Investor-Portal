import type { ChatbotUIMessage } from "@repo/ai-core";

/**
 * OpenAI Responses item IDs in persisted parts force item_reference replay on
 * the next turn. Without the paired reasoning items that causes 400s. Strip
 * those IDs so history is resent as plain content.
 */
export function stripOpenAIItemIds(
  messages: ChatbotUIMessage[],
): ChatbotUIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      const record = part as Record<string, unknown>;
      const providerMetadata = record.providerMetadata;
      const providerOptions = record.providerOptions;

      if (
        !isRecord(providerMetadata) &&
        !isRecord(providerOptions)
      ) {
        return part;
      }

      return {
        ...part,
        ...(isRecord(providerMetadata)
          ? { providerMetadata: stripItemIdFromProviderBag(providerMetadata) }
          : null),
        ...(isRecord(providerOptions)
          ? { providerOptions: stripItemIdFromProviderBag(providerOptions) }
          : null),
      } as typeof part;
    }),
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function stripItemIdFromProviderBag(
  bag: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...bag };
  if (isRecord(next.openai)) {
    const { itemId: _itemId, ...openaiRest } = next.openai;
    next.openai = openaiRest;
  }
  return next;
}

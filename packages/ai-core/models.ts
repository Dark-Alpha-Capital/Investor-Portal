import type { LanguageModel } from "ai";
import { deepSeek, openai } from "./providers";

export type ChatModelProvider = "openai" | "deepseek";

export type ChatModelOption = {
  id: string;
  name: string;
  provider: ChatModelProvider;
  supportsReasoning: boolean;
};

export const CHAT_MODELS = [
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    supportsReasoning: false,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    supportsReasoning: false,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
    supportsReasoning: false,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "deepseek",
    supportsReasoning: true,
  },
] as const satisfies readonly ChatModelOption[];

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "gpt-5-mini";

const chatModelById = new Map(
  CHAT_MODELS.map((model) => [model.id, model] as const),
);

export function isChatModelId(value: string): value is ChatModelId {
  return chatModelById.has(value as ChatModelId);
}

export function getChatModelOption(modelId: string): ChatModelOption | null {
  return chatModelById.get(modelId as ChatModelId) ?? null;
}

export function resolveModel(modelId: string): LanguageModel {
  const option = getChatModelOption(modelId);
  if (!option) {
    throw new Error(`Unsupported chat model: ${modelId}`);
  }

  switch (option.provider) {
    case "openai":
      // Use Chat Completions for multi-turn tool chats. The Responses API
      // requires paired reasoning items that break when history is reloaded
      // without those opaque reasoning parts.
      return openai.chat(option.id);
    case "deepseek":
      return deepSeek(option.id);
    default: {
      const _exhaustive: never = option.provider;
      throw new Error(`Unhandled provider: ${_exhaustive}`);
    }
  }
}

export function modelSupportsReasoning(modelId: string): boolean {
  return getChatModelOption(modelId)?.supportsReasoning ?? false;
}

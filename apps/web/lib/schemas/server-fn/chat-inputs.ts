import { z } from "zod";
import { CHAT_MODELS, DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";

export const chatIdInputSchema = z.object({
  chatId: z.string().trim().min(1).max(128),
});

export type ChatIdInput = z.infer<typeof chatIdInputSchema>;

const chatModelIdSchema = z.enum(
  CHAT_MODELS.map((model) => model.id) as [
    (typeof CHAT_MODELS)[number]["id"],
    ...(typeof CHAT_MODELS)[number]["id"][],
  ],
);

export const createChatInputSchema = z.object({
  model: chatModelIdSchema.default(DEFAULT_CHAT_MODEL_ID),
});

export type CreateChatInput = z.infer<typeof createChatInputSchema>;

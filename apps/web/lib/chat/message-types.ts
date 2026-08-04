import type { InferUITools, UIMessage } from "ai";
import type { chatTools } from "@/lib/chat/tools/registry";

/**
 * The UI tool types for the full chat registry — derived from the actual tool
 * definitions in `lib/chat/tools/registry.ts` so the message type always covers
 * every tool part the client renders.
 */
export type ChatbotUITools = InferUITools<typeof chatTools>;

/**
 * UI message type used across the chat surface. `type`-only import of
 * `chatTools` means no runtime dependency on the tool modules here.
 */
export type ChatbotUIMessage = UIMessage<never, Record<string, unknown>, ChatbotUITools>;

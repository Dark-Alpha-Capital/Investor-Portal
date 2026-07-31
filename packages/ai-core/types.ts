import type { InferUITools, UIMessage } from "ai";
import type { chatbotTools } from "./tools";

export type ChatbotUITools = InferUITools<typeof chatbotTools>;

export type ChatbotUIMessage = UIMessage<never, never, ChatbotUITools>;

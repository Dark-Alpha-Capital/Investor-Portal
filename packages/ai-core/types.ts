import type { InferUITools, UIMessage } from "ai";
import type { chatbotTools } from "./tools";

export type ChatbotUITools = InferUITools<typeof chatbotTools>;

/** Data parts emitted by json-render `pipeJsonRender` (e.g. `data-spec`). */
export type ChatbotUIDataTypes = {
  spec: unknown;
};

export type ChatbotUIMessage = UIMessage<
  never,
  ChatbotUIDataTypes,
  ChatbotUITools
>;

import {
  chatbotSystemPrompt,
  chatbotTools,
  getChatModelOption,
  isChatModelId,
  modelSupportsReasoning,
  resolveModel,
  type ChatbotUIMessage,
} from "@repo/ai-core";
import { pipeJsonRender } from "@json-render/core";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type ToolSet,
} from "ai";
import { waitUntil } from "cloudflare:workers";
import { authSession } from "@/lib/auth/session-from-request";
import { chatStreamErrorMessage } from "@/lib/chat/chat-stream-error";
import { loadChat, saveChat } from "@/lib/chat/chat-store";
import { chatCatalog } from "@/lib/json-render/catalog";

const chatInstructions = [
  chatbotSystemPrompt,
  chatCatalog.prompt({
    mode: "inline",
    customRules: [
      "Prefer UI specs for structured data (weather, metrics, short explainers).",
      "Never invent investor portfolio balances, deal terms, or compliance decisions.",
      "When displayWeather returns data, summarize briefly then emit a Weather/Metric Card UI.",
      "Do not use viewport height classes; UI sits inside the chat pane.",
    ],
  }),
].join("\n\n");

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = await authSession();
          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = (await request.json()) as {
            id?: string;
            message?: ChatbotUIMessage;
            model?: string;
          };

          const chatId = body.id;
          const message = body.message;
          const modelId = body.model;

          if (!chatId || !message) {
            return Response.json(
              { error: "Missing chat id or message" },
              { status: 400 },
            );
          }

          if (!modelId || !isChatModelId(modelId)) {
            return Response.json(
              { error: "Unsupported model" },
              { status: 400 },
            );
          }

          const modelOption = getChatModelOption(modelId);
          console.log("[chat] user-selected model", {
            chatId,
            userId: session.user.id,
            modelId,
            provider: modelOption?.provider,
            label: modelOption?.name,
          });

          const existing = await loadChat(chatId, session.user.id);
          if (!existing) {
            return Response.json({ error: "Chat not found" }, { status: 404 });
          }

          const messages = [...existing.messages, message];
          const tools = chatbotTools as ToolSet;

          let validatedMessages: ChatbotUIMessage[];
          try {
            validatedMessages = (await validateUIMessages({
              messages,
              tools,
            })) as ChatbotUIMessage[];
          } catch (error) {
            console.error("Chat message validation failed:", error);
            validatedMessages = messages;
          }

          const model = resolveModel(modelId);
          console.log("[chat] using model for streamText generation", {
            chatId,
            userId: session.user.id,
            modelId,
            provider: modelOption?.provider,
            sendReasoning: modelSupportsReasoning(modelId),
          });
          const sendReasoning = modelSupportsReasoning(modelId);

          const result = streamText({
            model,
            instructions: chatInstructions,
            messages: await convertToModelMessages(validatedMessages, {
              tools,
            }),
            tools: chatbotTools,
            stopWhen: isStepCount(5),
            onError: ({ error }) => {
              console.error("streamText error:", error);
            },
          });

          void result.consumeStream();

          const uiStream = toUIMessageStream({
            stream: result.stream,
            tools: chatbotTools,
            sendReasoning,
            generateMessageId: createIdGenerator({
              prefix: "msg",
              size: 16,
            }),
            onError: chatStreamErrorMessage,
          });

          const stream = createUIMessageStream({
            originalMessages: validatedMessages,
            execute: async ({ writer }) => {
              writer.merge(pipeJsonRender(uiStream));
            },
            onError: chatStreamErrorMessage,
            onEnd: ({ messages: nextMessages }) => {
              waitUntil(
                saveChat({
                  chatId,
                  userId: session.user.id,
                  messages: nextMessages as ChatbotUIMessage[],
                  model: modelId,
                }),
              );
            },
          });

          return createUIMessageStreamResponse({ stream });
        } catch (error) {
          console.error("Chat API error:", error);
          return Response.json(
            { error: "Something went wrong." },
            { status: 500 },
          );
        }
      },
    },
  },
});

import {
  chatbotSystemPrompt,
  getChatModelOption,
  isChatModelId,
  modelSupportsReasoning,
  resolveModel,
  type ChatbotUIMessage,
} from "@repo/ai-core";
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
  type InferUIMessageChunk,
  type ToolSet,
} from "ai";
import { waitUntil } from "cloudflare:workers";
import { authSession } from "@/lib/auth/session-from-request";
import { chatStreamErrorMessage } from "@/lib/chat/chat-stream-error";
import { loadChat, saveChat } from "@/lib/chat/chat-store";
import { stripOpenAIItemIds } from "@/lib/chat/strip-openai-item-ids";
import {
  getChatToolInstructions,
  getChatToolsForUser,
} from "@/lib/chat/tools";

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
          const tools = getChatToolsForUser(session.user) as ToolSet;
          const chatInstructions = [
            chatbotSystemPrompt,
            getChatToolInstructions(session.user),
          ].join("\n\n");

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

          const modelMessages = await convertToModelMessages(
            stripOpenAIItemIds(validatedMessages),
            { tools },
          );

          const result = streamText({
            model,
            instructions: chatInstructions,
            messages: modelMessages,
            tools,
            stopWhen: isStepCount(5),
            onError: ({ error }) => {
              console.error("streamText error:", error);
            },
          });

          void result.consumeStream();

          const uiStream = toUIMessageStream({
            stream: result.stream,
            tools,
            sendReasoning,
            generateMessageId: createIdGenerator({
              prefix: "msg",
              size: 16,
            }),
            onError: chatStreamErrorMessage,
          });

          const stream = createUIMessageStream<ChatbotUIMessage>({
            originalMessages: validatedMessages,
            execute: async ({ writer }) => {
              writer.merge(
                uiStream as ReadableStream<
                  InferUIMessageChunk<ChatbotUIMessage>
                >,
              );
            },
            onError: chatStreamErrorMessage,
            onEnd: ({ messages: nextMessages }) => {
              waitUntil(
                saveChat({
                  chatId,
                  userId: session.user.id,
                  messages: nextMessages,
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

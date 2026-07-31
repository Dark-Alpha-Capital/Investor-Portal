"use client";

import { useChat } from "@ai-sdk/react";
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatbotUIMessage,
  type ChatModelId,
} from "@repo/ai-core";
import { useJsonRenderMessage } from "@json-render/react";
import { DefaultChatTransport } from "ai";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Weather } from "@/components/chatbot/weather";
import { Button } from "@/components/ui/button";
import { configureAiSdkClientWarnings } from "@/lib/ai/configure-sdk-warnings";
import { ChatJsonRenderer } from "@/lib/json-render/renderer";

type ChatViewProps = {
  chatId: string;
  initialMessages: ChatbotUIMessage[];
  initialModel: string;
};

function resolveInitialModel(model: string): ChatModelId {
  return isChatModelId(model) ? model : DEFAULT_CHAT_MODEL_ID;
}

function removeFailedTurn(messages: ChatbotUIMessage[]): ChatbotUIMessage[] {
  // If the assistant started streaming before the error, drop both that
  // partial response and its user message; otherwise drop only the user turn.
  return messages.at(-1)?.role === "assistant"
    ? messages.slice(0, -2)
    : messages.slice(0, -1);
}

function ChatMessage({
  message,
  isStreaming,
}: {
  message: ChatbotUIMessage;
  isStreaming: boolean;
}) {
  const { spec, hasSpec } = useJsonRenderMessage(
    message.parts as Parameters<typeof useJsonRenderMessage>[0],
  );

  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <MessageResponse key={`${message.id}-text-${index}`}>
                {part.text}
              </MessageResponse>
            );
          }

          if (part.type === "reasoning") {
            return (
              <Reasoning
                isStreaming={isStreaming}
                key={`${message.id}-reasoning-${index}`}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }

          if (part.type === "tool-displayWeather") {
            const weatherKey = `${message.id}-weather-${index}`;
            switch (part.state) {
              case "input-streaming":
              case "input-available":
              case "approval-requested":
              case "approval-responded":
                return (
                  <div
                    className="text-sm text-muted-foreground"
                    key={weatherKey}
                  >
                    Loading weather…
                  </div>
                );
              case "output-available":
                return <Weather key={weatherKey} {...part.output} />;
              case "output-error":
                return (
                  <div className="text-sm text-destructive" key={weatherKey}>
                    Error: {part.errorText}
                  </div>
                );
              case "output-denied":
                return (
                  <div
                    className="text-sm text-muted-foreground"
                    key={weatherKey}
                  >
                    Weather request denied.
                  </div>
                );
              default: {
                const _exhaustive: never = part;
                return _exhaustive;
              }
            }
          }

          // data-spec and other data parts are handled by useJsonRenderMessage
          return null;
        })}
        {hasSpec ? (
          <ChatJsonRenderer loading={isStreaming} spec={spec} />
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function ChatView({
  chatId,
  initialMessages,
  initialModel,
}: ChatViewProps) {
  const [model, setModel] = useState<ChatModelId>(
    resolveInitialModel(initialModel),
  );
  const modelRef = useRef(model);
  modelRef.current = model;
  // PromptInput calls form.reset() on submit, which can fire Select onValueChange
  // with the first option. Only accept changes while the user has the menu open.
  const isSelectingModelRef = useRef(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    configureAiSdkClientWarnings();
  }, []);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ id, messages }) {
          return {
            body: {
              id,
              message: messages[messages.length - 1],
              model: modelRef.current,
            },
          };
        },
      }),
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    regenerate,
  } = useChat<ChatbotUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    onError: (chatError) => {
      console.error("Chat error:", chatError);
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const canSubmit = status === "ready" || error != null;

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || !canSubmit || isBusy) {
      return;
    }

    if (error != null) {
      setMessages(removeFailedTurn);
    }

    void sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="w-full px-4 py-6 md:px-8">
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Ask about the portal, or try “What’s the weather in San Francisco?”"
              icon={<MessageSquare className="size-10" />}
              title="Start a conversation"
            />
          ) : (
            messages.map((message) => (
              <ChatMessage
                isStreaming={
                  status === "streaming" && message.id === messages.at(-1)?.id
                }
                key={message.id}
                message={message}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error ? (
        <div className="mx-auto flex w-full items-center justify-between gap-3 border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-sm md:px-8">
          <span>Something went wrong.</span>
          <Button
            disabled={isBusy}
            onClick={() => void regenerate()}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="shrink-0 border-t px-4 py-3 md:px-8">
        <div className="w-full">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                disabled={isBusy}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  error != null
                    ? "Edit your message and try again..."
                    : "Say something..."
                }
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputSelect
                  onOpenChange={(open) => {
                    if (open) {
                      isSelectingModelRef.current = true;
                      return;
                    }
                    // Defer clear so selecting an item still counts as intentional.
                    queueMicrotask(() => {
                      isSelectingModelRef.current = false;
                    });
                  }}
                  onValueChange={(value) => {
                    if (!isSelectingModelRef.current) {
                      return;
                    }
                    if (isChatModelId(value)) {
                      setModel(value);
                    }
                  }}
                  value={model}
                >
                  <PromptInputSelectTrigger className="w-[11.5rem]">
                    <PromptInputSelectValue placeholder="Model" />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {CHAT_MODELS.map((option) => (
                      <PromptInputSelectItem key={option.id} value={option.id}>
                        {option.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
              {isBusy ? (
                <Button
                  onClick={() => stop()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Stop
                </Button>
              ) : (
                <PromptInputSubmit disabled={!canSubmit} />
              )}
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

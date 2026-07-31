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
import { renderDedicatedToolPart } from "@/components/chatbot/tool-ui";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { configureAiSdkClientWarnings } from "@/lib/ai/configure-sdk-warnings";
import { ChatJsonRenderer } from "@/lib/json-render/renderer";
import { cn } from "@/lib/utils";

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

function assistantHasVisibleContent(message: ChatbotUIMessage | undefined) {
  if (message?.role !== "assistant") {
    return false;
  }

  return message.parts.some((part) => {
    if (part.type === "text") {
      return part.text.trim().length > 0;
    }
    if (part.type === "reasoning") {
      return part.text.trim().length > 0;
    }
    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
      return part.state !== "input-streaming";
    }
    if (part.type.startsWith("data-")) {
      return true;
    }
    return false;
  });
}

function ChatThinkingIndicator({ className }: { className?: string }) {
  return (
    <Message className={cn("animate-in fade-in duration-200", className)} from="assistant">
      <MessageContent>
        <div
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner className="size-4" />
          <span>Thinking…</span>
        </div>
      </MessageContent>
    </Message>
  );
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
          const partKey = `${message.id}-part-${index}`;

          if (part.type === "text") {
            return (
              <MessageResponse key={partKey}>{part.text}</MessageResponse>
            );
          }

          if (part.type === "reasoning") {
            return (
              <Reasoning isStreaming={isStreaming} key={partKey}>
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }

          // 1) Dedicated tool UI (e.g. displayWeather → Weather)
          const toolUi = renderDedicatedToolPart(part, partKey);
          if (toolUi != null) {
            return toolUi;
          }

          // 2) No dedicated tool UI — json-render / text handle the rest
          return null;
        })}
        {/* Fallback generative UI for catalog specs (metrics, cards, etc.) */}
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
  const lastMessage = messages.at(-1);
  const showThinking =
    isBusy &&
    error == null &&
    (lastMessage?.role === "user" ||
      !assistantHasVisibleContent(lastMessage));

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
            <>
              {messages.map((message) => (
                <ChatMessage
                  isStreaming={
                    status === "streaming" && message.id === messages.at(-1)?.id
                  }
                  key={message.id}
                  message={message}
                />
              ))}
              {showThinking ? <ChatThinkingIndicator /> : null}
            </>
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

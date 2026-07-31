"use client";

import { useChat } from "@ai-sdk/react";
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatbotUIMessage,
  type ChatModelId,
} from "@repo/ai-core";
import { DefaultChatTransport, isToolUIPart } from "ai";
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
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { configureAiSdkClientWarnings } from "@/lib/ai/configure-sdk-warnings";

type ChatViewProps = {
  chatId: string;
  initialMessages: ChatbotUIMessage[];
  initialModel: string;
  title: string;
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

export function ChatView({
  chatId,
  initialMessages,
  initialModel,
  title,
}: ChatViewProps) {
  const [model, setModel] = useState<ChatModelId>(
    resolveInitialModel(initialModel),
  );
  const modelRef = useRef(model);
  modelRef.current = model;
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
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-3xl flex-col px-4 py-4">
      <div className="mb-3 shrink-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      <Conversation className="min-h-0 flex-1 rounded-lg border">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Ask about the portal, or try “What’s the weather in San Francisco?”"
              icon={<MessageSquare className="size-10" />}
              title="Start a conversation"
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
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
                          isStreaming={
                            status === "streaming" &&
                            message.id === messages.at(-1)?.id
                          }
                          key={`${message.id}-reasoning-${index}`}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    }

                    if (isToolUIPart(part)) {
                      const toolHeader =
                        part.type === "dynamic-tool" ? (
                          <ToolHeader
                            state={part.state}
                            toolName={part.toolName}
                            type="dynamic-tool"
                          />
                        ) : (
                          <ToolHeader state={part.state} type={part.type} />
                        );

                      return (
                        <Tool
                          defaultOpen={part.state !== "output-available"}
                          key={`${message.id}-tool-${index}`}
                        >
                          {toolHeader}
                          <ToolContent>
                            {"input" in part ? (
                              <ToolInput input={part.input} />
                            ) : null}
                            <ToolOutput
                              errorText={
                                "errorText" in part ? part.errorText : undefined
                              }
                              output={
                                "output" in part && part.output != null ? (
                                  <MessageResponse>
                                    {typeof part.output === "string"
                                      ? part.output
                                      : JSON.stringify(part.output, null, 2)}
                                  </MessageResponse>
                                ) : undefined
                              }
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }

                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
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

      <div className="mt-3 shrink-0 space-y-2">
        {/* Keep model select outside PromptInput — the form calls reset() on
            submit, which resets Radix Select back to the first option. */}
        <div className="flex items-center justify-between gap-2">
          <PromptInputSelect
            onValueChange={(value) => {
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
        </div>

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
            {isBusy ? (
              <Button onClick={() => stop()} size="sm" type="button" variant="secondary">
                Stop
              </Button>
            ) : (
              <PromptInputSubmit disabled={!canSubmit} />
            )}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

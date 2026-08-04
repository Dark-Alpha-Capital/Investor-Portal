"use client";

import { useChat } from "@ai-sdk/react";
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatModelId,
} from "@repo/ai-core";
import type { ChatbotUIMessage } from "@/lib/chat/message-types";
import { DefaultChatTransport } from "ai";
import { BriefcaseBusiness, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
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
import {
  DealSelectorDialog,
  type DealSelectorOption,
} from "@/components/chatbot/deal-selector-dialog";
import { renderDedicatedToolPart } from "@/components/chatbot/tool-ui";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { configureAiSdkClientWarnings } from "@/lib/ai/configure-sdk-warnings";
import { isAdminUser } from "@/lib/auth/user-role-guards";
import {
  setChatDealFn,
  type SetChatDealFetchResult,
} from "@/lib/server-fns/chatbot-route-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const chatbotRoute = getRouteApi("/_chatbot");

type ChatViewProps = {
  chatId: string;
  initialMessages: ChatbotUIMessage[];
  initialModel: string;
  initialDealId: string | null;
  initialDealName: string | null;
};

function resolveInitialModel(model: string): ChatModelId {
  return isChatModelId(model) ? model : DEFAULT_CHAT_MODEL_ID;
}

function removeFailedTurn(messages: ChatbotUIMessage[]): ChatbotUIMessage[] {
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
      const state = "state" in part ? part.state : undefined;
      return state !== "input-streaming";
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
  chatId,
  onNeedsDealSelection,
}: {
  message: ChatbotUIMessage;
  isStreaming: boolean;
  chatId: string;
  onNeedsDealSelection?: () => void;
}) {
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

          const toolUi = renderDedicatedToolPart(part, partKey, {
            chatId,
            onNeedsDealSelection,
          });
          if (toolUi != null) {
            return toolUi;
          }

          return null;
        })}
      </MessageContent>
    </Message>
  );
}

export function ChatView({
  chatId,
  initialMessages,
  initialModel,
  initialDealId,
  initialDealName,
}: ChatViewProps) {
  const { session } = chatbotRoute.useRouteContext();
  const isAdmin = isAdminUser(session.user);

  const [model, setModel] = useState<ChatModelId>(
    resolveInitialModel(initialModel),
  );
  const modelRef = useRef(model);
  modelRef.current = model;
  const isSelectingModelRef = useRef(false);
  const [input, setInput] = useState("");
  const [dealId, setDealId] = useState<string | null>(initialDealId);
  const [dealName, setDealName] = useState<string | null>(initialDealName);
  const [dealSelectorOpen, setDealSelectorOpen] = useState(false);
  const [isSettingDeal, setIsSettingDeal] = useState(false);

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

  const handleSelectDeal = async (deal: DealSelectorOption) => {
    setIsSettingDeal(true);
    try {
      const result = (await setChatDealFn({
        data: { chatId, dealId: deal.id },
      })) as SetChatDealFetchResult;
      if (result.tag === "ok") {
        setDealId(result.chat.dealId);
        setDealName(result.chat.dealName);
        setDealSelectorOpen(false);
        toast.success(`Deal context set to ${deal.name}`);
        return;
      }
      if (result.tag === "forbidden") {
        toast.error(result.message);
        return;
      }
      toast.error("Could not set deal context");
    } catch {
      toast.error("Could not set deal context");
    } finally {
      setIsSettingDeal(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="w-full px-4 py-6 md:px-8">
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Ask about a deal, or use Select deal in the composer to bind context."
              icon={<MessageSquare className="size-10" />}
              title="Start a conversation"
            />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  chatId={chatId}
                  isStreaming={
                    status === "streaming" && message.id === messages.at(-1)?.id
                  }
                  key={message.id}
                  message={message}
                  onNeedsDealSelection={() => setDealSelectorOpen(true)}
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
                    : dealName
                      ? `Ask about ${dealName}…`
                      : "Say something..."
                }
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <Button
                  className="h-8 max-w-[14rem] gap-1.5 px-2.5"
                  disabled={isBusy || isSettingDeal}
                  onClick={() => setDealSelectorOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <BriefcaseBusiness className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {dealName ?? "Select deal"}
                  </span>
                </Button>
                <PromptInputSelect
                  onOpenChange={(open) => {
                    if (open) {
                      isSelectingModelRef.current = true;
                      return;
                    }
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

      <DealSelectorDialog
        isAdmin={isAdmin}
        onOpenChange={setDealSelectorOpen}
        onSelect={(deal) => {
          void handleSelectDeal(deal);
        }}
        open={dealSelectorOpen}
        selectedDealId={dealId}
      />
    </div>
  );
}

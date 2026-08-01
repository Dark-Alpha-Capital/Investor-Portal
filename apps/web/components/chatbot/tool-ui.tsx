"use client";

import type { ChatbotUIMessage } from "@repo/ai-core";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { useEffect, type ReactNode } from "react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ProposeKnowledgeRequestCard } from "@/components/chatbot/propose-knowledge-request-card";
import { Weather } from "@/components/chatbot/weather";
import { Button } from "@/components/ui/button";

type MessagePart = ChatbotUIMessage["parts"][number];

type ChatToolPart = Extract<
  MessagePart,
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

export type ToolUiOptions = {
  chatId?: string;
  onNeedsDealSelection?: () => void;
};

const TOOL_TITLES: Record<string, string> = {
  displayWeather: "Weather",
  listInvestors: "List investors",
  getInvestorDetails: "Investor details",
  listMarketplaceDeals: "Marketplace deals",
  searchDealKnowledge: "Search deal knowledge",
  proposeKnowledgeRequest: "Propose question",
};

function toolNameFromPart(part: ChatToolPart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }
  return part.type.slice("tool-".length);
}

function isChatToolPart(part: MessagePart): part is ChatToolPart {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function NeedsDealSelectionCard({
  onNeedsDealSelection,
}: {
  onNeedsDealSelection?: () => void;
}) {
  useEffect(() => {
    onNeedsDealSelection?.();
  }, [onNeedsDealSelection]);

  return (
    <div className="space-y-2 rounded-lg border bg-muted/40 px-3 py-3 text-sm">
      <p>Select a deal in the composer to continue.</p>
      {onNeedsDealSelection ? (
        <Button
          onClick={onNeedsDealSelection}
          size="sm"
          type="button"
          variant="outline"
        >
          Select deal
        </Button>
      ) : null}
    </div>
  );
}

function renderToolOutput(
  part: ChatToolPart,
  options?: ToolUiOptions,
): ReactNode {
  if (part.state !== "output-available") {
    return null;
  }

  if (
    part.type === "tool-displayWeather" &&
    part.output &&
    typeof part.output === "object"
  ) {
    const output = part.output as {
      location: string;
      weather: string;
      temperature: number;
    };
    return <Weather {...output} />;
  }

  const name = toolNameFromPart(part);
  const output =
    part.output && typeof part.output === "object"
      ? (part.output as Record<string, unknown>)
      : null;

  if (
    (name === "searchDealKnowledge" || name === "proposeKnowledgeRequest") &&
    output?.code === "needs_deal_selection"
  ) {
    return (
      <NeedsDealSelectionCard
        onNeedsDealSelection={options?.onNeedsDealSelection}
      />
    );
  }

  if (
    name === "proposeKnowledgeRequest" &&
    output?.code === "awaiting_confirmation" &&
    typeof output.dealId === "string" &&
    typeof output.title === "string" &&
    typeof output.question === "string" &&
    options?.chatId
  ) {
    return (
      <ProposeKnowledgeRequestCard
        chatId={options.chatId}
        dealId={output.dealId}
        question={output.question}
        title={output.title}
      />
    );
  }

  return part.output as ReactNode;
}

function toolErrorText(part: ChatToolPart): string | undefined {
  if (part.state === "output-error") {
    return part.errorText;
  }
  if (part.state === "output-denied") {
    return "Tool request denied.";
  }
  return undefined;
}

/**
 * Renders any tool / dynamic-tool part with the AI Elements Tool collapsible.
 */
export function renderDedicatedToolPart(
  part: MessagePart,
  partKey: string,
  options?: ToolUiOptions,
): ReactNode {
  if (!isChatToolPart(part)) {
    return null;
  }

  const name = toolNameFromPart(part);
  const title = TOOL_TITLES[name] ?? name;
  const defaultOpen =
    part.state === "output-available" ||
    part.state === "output-error" ||
    part.state === "output-denied";

  const header =
    part.type === "dynamic-tool" ? (
      <ToolHeader
        state={(part as DynamicToolUIPart).state}
        title={title}
        toolName={part.toolName}
        type="dynamic-tool"
      />
    ) : (
      <ToolHeader
        state={(part as ToolUIPart).state}
        title={title}
        type={(part as ToolUIPart).type}
      />
    );

  const isDedicatedCard =
    part.state === "output-available" &&
    part.output &&
    typeof part.output === "object" &&
    ((part.output as { code?: string }).code === "needs_deal_selection" ||
      (part.output as { code?: string }).code === "awaiting_confirmation");

  if (isDedicatedCard) {
    return (
      <div className="my-2" key={partKey}>
        {renderToolOutput(part, options)}
      </div>
    );
  }

  return (
    <Tool defaultOpen={defaultOpen} key={partKey}>
      {header}
      <ToolContent>
        {"input" in part && part.input != null ? (
          <ToolInput input={part.input} />
        ) : null}
        <ToolOutput
          errorText={toolErrorText(part)}
          output={renderToolOutput(part, options)}
        />
      </ToolContent>
    </Tool>
  );
}

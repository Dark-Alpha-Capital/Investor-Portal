"use client";

import type { ChatbotUIMessage } from "@repo/ai-core";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ReactNode } from "react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Weather } from "@/components/chatbot/weather";

type MessagePart = ChatbotUIMessage["parts"][number];

type ChatToolPart = Extract<
  MessagePart,
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

const TOOL_TITLES: Record<string, string> = {
  displayWeather: "Weather",
  listInvestors: "List investors",
  getInvestorDetails: "Investor details",
  listMarketplaceDeals: "Marketplace deals",
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

function renderToolOutput(part: ChatToolPart): ReactNode {
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

  return part.output;
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

  return (
    <Tool defaultOpen={defaultOpen} key={partKey}>
      {header}
      <ToolContent>
        {"input" in part && part.input != null ? (
          <ToolInput input={part.input} />
        ) : null}
        <ToolOutput
          errorText={toolErrorText(part)}
          output={renderToolOutput(part)}
        />
      </ToolContent>
    </Tool>
  );
}

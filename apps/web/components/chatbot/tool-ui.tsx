"use client";

import type { ChatbotUIMessage } from "@repo/ai-core";
import type { ReactNode } from "react";
import { Weather } from "@/components/chatbot/weather";

type MessagePart = ChatbotUIMessage["parts"][number];

type ToolPart = Extract<MessagePart, { type: `tool-${string}` }>;

type ToolUiRenderer = (args: {
  part: ToolPart;
  partKey: string;
}) => ReactNode;

/**
 * Dedicated generative UI for known tools.
 * Tools not listed here fall through — the model may use json-render instead.
 */
const toolUiByName: Record<string, ToolUiRenderer> = {
  displayWeather: ({ part, partKey }) => {
    if (part.type !== "tool-displayWeather") {
      return null;
    }

    switch (part.state) {
      case "input-streaming":
      case "input-available":
      case "approval-requested":
      case "approval-responded":
        return (
          <div className="text-sm text-muted-foreground" key={partKey}>
            Loading weather…
          </div>
        );
      case "output-available":
        return <Weather key={partKey} {...part.output} />;
      case "output-error":
        return (
          <div className="text-sm text-destructive" key={partKey}>
            Error: {part.errorText}
          </div>
        );
      case "output-denied":
        return (
          <div className="text-sm text-muted-foreground" key={partKey}>
            Weather request denied.
          </div>
        );
      default: {
        const _exhaustive: never = part;
        return _exhaustive;
      }
    }
  },
};

function toolNameFromPartType(type: string): string | null {
  if (!type.startsWith("tool-") || type === "dynamic-tool") {
    return null;
  }
  return type.slice("tool-".length);
}

/**
 * Renders a tool part with its dedicated component, or null if none is registered
 * (json-render is the fallback for those cases).
 */
export function renderDedicatedToolPart(
  part: MessagePart,
  partKey: string,
): ReactNode {
  const name = toolNameFromPartType(part.type);
  if (name == null) {
    return null;
  }
  const render = toolUiByName[name];
  if (!render) {
    return null;
  }
  return render({ part: part as ToolPart, partKey });
}

import { describe, expect, test } from "bun:test";
import type { ChatbotUIMessage } from "@/lib/chat/message-types";
import { asChatbotMessages, titleFromMessages } from "./message-utils";

function userMessage(text: string): ChatbotUIMessage {
  return {
    id: "u1",
    role: "user",
    parts: [{ type: "text", text }],
  } as unknown as ChatbotUIMessage;
}

describe("chat-store pure helpers", () => {
  test("asChatbotMessages strips metadata from stored messages", () => {
    const raw = [
      {
        id: "u1",
        role: "user",
        metadata: { foo: "bar" },
        parts: [{ type: "text", text: "hi" }],
      },
    ] as unknown;
    const result = asChatbotMessages(raw);
    expect(result[0].metadata).toBeUndefined();
    expect(result).toEqual([
      expect.objectContaining({
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "hi" }],
      }),
    ]);
  });

  test("asChatbotMessages returns [] for non-array input", () => {
    expect(asChatbotMessages(null)).toEqual([]);
    expect(asChatbotMessages("nope")).toEqual([]);
  });

  test("titleFromMessages derives from first user text part", () => {
    const title = titleFromMessages([userMessage("What deals are live?")]);
    expect(title).toBe("What deals are live?");
  });

  test("titleFromMessages truncates long titles", () => {
    const long = "x".repeat(200);
    const title = titleFromMessages([userMessage(long)]);
    expect(title).toHaveLength(60);
    expect(title!.endsWith("...")).toBe(true);
  });

  test("titleFromMessages returns null when no user text", () => {
    expect(titleFromMessages([])).toBeNull();
    expect(
      titleFromMessages([{ id: "a", role: "assistant", parts: [{ type: "text", text: "hi" }] } as ChatbotUIMessage]),
    ).toBeNull();
  });
});

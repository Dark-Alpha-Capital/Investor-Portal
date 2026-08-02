import { describe, expect, test } from "bun:test";
import {
  isActiveCommitmentStatus,
  isArchivedCommitmentStatus,
  isPortfolioModeStatus,
  isPreFundingStatus,
} from "@repo/db/investment-closing";
import {
  assertTransition,
  canTransition,
  getNextAdminAdvanceStatus,
  isTerminalClosingStatus,
} from "./state-machine";

describe("investment closing state machine", () => {
  test("allows draft → pending_documents for investor", () => {
    expect(canTransition("draft", "pending_documents", "investor")).toBe(true);
  });

  test("rejects investor funding transition", () => {
    expect(canTransition("awaiting_funds", "funded", "investor")).toBe(false);
  });

  test("allows admin awaiting_funds → funded", () => {
    expect(canTransition("awaiting_funds", "funded", "admin")).toBe(true);
  });

  test("happy path transitions", () => {
    const path: Array<[string, string, "investor" | "admin" | "system"]> = [
      ["draft", "pending_documents", "system"],
      ["pending_documents", "documents_generated", "system"],
      ["documents_generated", "awaiting_signature", "admin"],
      ["awaiting_signature", "awaiting_funds", "system"],
      ["awaiting_funds", "funded", "admin"],
      ["funded", "closed", "admin"],
    ];
    for (const [from, to, actor] of path) {
      expect(canTransition(from, to, actor)).toBe(true);
    }
  });

  test("awaiting_signature advances only via system (auto-execute)", () => {
    expect(canTransition("awaiting_signature", "awaiting_funds", "system")).toBe(
      true
    );
    expect(canTransition("awaiting_signature", "awaiting_funds", "admin")).toBe(
      false
    );
    expect(canTransition("awaiting_signature", "awaiting_funds", "investor")).toBe(
      false
    );
  });

  test("assertTransition throws on illegal edge", () => {
    expect(() => assertTransition("draft", "funded", "admin")).toThrow();
  });

  test("terminal statuses", () => {
    expect(isTerminalClosingStatus("closed")).toBe(true);
    expect(isTerminalClosingStatus("cancelled")).toBe(true);
    expect(isTerminalClosingStatus("awaiting_funds")).toBe(false);
  });

  test("admin advance map", () => {
    expect(getNextAdminAdvanceStatus("pending_documents")).toBe(
      "documents_generated"
    );
    expect(getNextAdminAdvanceStatus("awaiting_signature")).toBeNull();
  });

  test("archived commitments allow recommit", () => {
    expect(isArchivedCommitmentStatus("cancelled")).toBe(true);
    expect(isActiveCommitmentStatus("cancelled")).toBe(false);
    expect(isActiveCommitmentStatus("pending_documents")).toBe(true);
    expect(isActiveCommitmentStatus("funded")).toBe(true);
  });

  test("pre-funding vs portfolio modes", () => {
    expect(isPreFundingStatus("awaiting_signature")).toBe(true);
    expect(isPreFundingStatus("funded")).toBe(false);
    expect(isPortfolioModeStatus("funded")).toBe(true);
    expect(isPortfolioModeStatus("awaiting_funds")).toBe(false);
  });
});

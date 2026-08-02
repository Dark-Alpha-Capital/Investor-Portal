import {
  assertTransition,
  canTransition,
  getNextAdminAdvanceStatus,
  isClosingStatus,
  isTerminalClosingStatus,
  type InvestmentClosingStatus,
  type TransitionActor,
} from "@repo/db/investment-closing";

export {
  assertTransition,
  canTransition,
  getNextAdminAdvanceStatus,
  isClosingStatus,
  isTerminalClosingStatus,
};

export function requireTransition(
  from: string,
  to: InvestmentClosingStatus,
  actor: TransitionActor
): void {
  assertTransition(from, to, actor);
}

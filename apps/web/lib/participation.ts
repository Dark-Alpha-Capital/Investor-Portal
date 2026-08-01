/**
 * Derive simplified participation status from dealInterest + investment.
 * Source of truth remains those tables; this is presentation-only.
 */

export type ParticipationStatus =
  | "no_response"
  | "interested"
  | "committed"
  | "funded"
  | "declined";

export const PARTICIPATION_LABELS: Record<ParticipationStatus, string> = {
  no_response: "No Response",
  interested: "Interested",
  committed: "Committed",
  funded: "Funded",
  declined: "Declined",
};

type InterestLike = {
  status: string;
} | null | undefined;

type InvestmentLike = {
  status: string;
} | null | undefined;

export function deriveParticipationStatus(
  interest: InterestLike,
  investment: InvestmentLike
): ParticipationStatus {
  if (investment) {
    if (investment.status === "funded") {
      return "funded";
    }
    // committed, pending, confirmed, transferred, liquidated, written_off → Committed for MVP UI
    return "committed";
  }

  if (interest) {
    if (interest.status === "pass") {
      return "declined";
    }
    return "interested";
  }

  return "no_response";
}

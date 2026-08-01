/**
 * Deal lifecycle vs investor access are orthogonal.
 *
 * - Investor approval / invitation → can this person access a deal?
 * - Deal status → is the firm currently marketing (or still exposing) this deal?
 *
 * Marketplace listing uses {@link isVisibleInMarketplace}.
 * Deal detail (deep links / portfolio) uses {@link isAccessibleDealDetail}.
 */

export type DealLifecycleStatus =
  | "draft"
  | "coming_soon"
  | "live"
  | "closing"
  | "funded"
  | "exited"
  | "cancelled";

/** Statuses shown in the investor marketplace. MVP: live only. */
export const MARKETPLACE_VISIBLE_STATUSES = ["live"] as const;

/** Statuses an invited investor may open via deal detail. */
export const DEAL_DETAIL_ACCESSIBLE_STATUSES = [
  "live",
  "closing",
  "funded",
  "exited",
] as const;

/**
 * MVP marketplace rule: only Live deals are marketed to investors.
 * Change {@link MARKETPLACE_VISIBLE_STATUSES} (or this function) to evolve later.
 */
export function isVisibleInMarketplace(deal: { status: string }): boolean {
  return (MARKETPLACE_VISIBLE_STATUSES as readonly string[]).includes(
    deal.status
  );
}

/**
 * Deal detail / deep-link rule for invited investors.
 * Live + post-raise stages remain open; draft / coming soon / cancelled stay hidden.
 */
export function isAccessibleDealDetail(deal: { status: string }): boolean {
  return (DEAL_DETAIL_ACCESSIBLE_STATUSES as readonly string[]).includes(
    deal.status
  );
}

/** Whether new capital commitments are allowed for this deal lifecycle stage. */
export function isOpenForCommitments(deal: { status: string }): boolean {
  return deal.status === "live";
}

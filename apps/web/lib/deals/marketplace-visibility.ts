/**
 * Re-export deal marketplace visibility helpers for the web app.
 */
export {
  isVisibleInMarketplace,
  isAccessibleDealDetail,
  isOpenForCommitments,
  MARKETPLACE_VISIBLE_STATUSES,
  DEAL_DETAIL_ACCESSIBLE_STATUSES,
  type DealLifecycleStatus,
} from "@repo/db/deal-marketplace";

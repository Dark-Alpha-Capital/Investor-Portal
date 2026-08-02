/**
 * Investment subscription closing lifecycle.
 * Status transitions are explicit — never use boolean flags.
 */

export const INVESTMENT_CLOSING_STATUSES = [
  "draft",
  "pending_documents",
  "documents_generated",
  "awaiting_signature",
  "awaiting_funds",
  "funded",
  "closed",
  "cancelled",
  "expired",
  "rejected",
] as const;

export const INVESTMENT_EXIT_STATUSES = [
  "transferred",
  "liquidated",
  "written_off",
] as const;

export type InvestmentClosingStatus =
  (typeof INVESTMENT_CLOSING_STATUSES)[number];
export type InvestmentExitStatus = (typeof INVESTMENT_EXIT_STATUSES)[number];
export type InvestmentStatus =
  | InvestmentClosingStatus
  | InvestmentExitStatus;

export const SUBSCRIPTION_DOCUMENT_TYPES = [
  "subscription_agreement",
  "operating_agreement",
  "investor_questionnaire",
  "tax_form",
  "wire_instructions",
] as const;

export type SubscriptionDocumentType =
  (typeof SUBSCRIPTION_DOCUMENT_TYPES)[number];

/**
 * Document business states. `viewed` / `downloaded` are telemetry, not states —
 * they are recorded as timestamps + audit events, never gate progress.
 *
 * Signature docs:   generated → sent → signed → executed
 * Informational docs (e.g. wire instructions, signatureRequired=false):
 *                   generated → available → downloaded
 */
export const SUBSCRIPTION_DOCUMENT_STATUSES = [
  "not_generated",
  "generated",
  "available",
  "sent",
  "signed",
  "downloaded",
  "executed",
] as const;

export type SubscriptionDocumentStatus =
  (typeof SUBSCRIPTION_DOCUMENT_STATUSES)[number];

export const SIGNATURE_REQUEST_STATUSES = [
  "pending",
  "sent",
  "signed",
  "declined",
  "voided",
] as const;

export type SignatureRequestStatus =
  (typeof SIGNATURE_REQUEST_STATUSES)[number];

export const CLOSING_EVENT_TYPES = [
  "commitment_created",
  "package_created",
  "status_changed",
  "package_generated",
  "package_regenerated",
  "document_generated",
  "document_replacement_uploaded",
  "signature_requested",
  "document_viewed",
  "document_downloaded",
  "document_signed",
  "document_countersigned",
  "package_fully_signed",
  "funds_required",
  "funds_received",
  "investment_closed",
  "commitment_cancelled",
  "commitment_rejected",
  "commitment_expired",
  "admin_approved",
  "notification_emitted",
] as const;

export type ClosingEventType = (typeof CLOSING_EVENT_TYPES)[number];

/** Actor role used for transition permission checks. */
export type TransitionActor = "investor" | "admin" | "system";

type TransitionRule = {
  to: InvestmentClosingStatus;
  actors: TransitionActor[];
};

/**
 * Allowed closing transitions. Exit statuses are handled separately via admin update.
 */
export const CLOSING_TRANSITIONS: Record<
  InvestmentClosingStatus,
  TransitionRule[]
> = {
  draft: [
    { to: "pending_documents", actors: ["investor", "admin", "system"] },
    { to: "cancelled", actors: ["investor", "admin"] },
    { to: "expired", actors: ["admin", "system"] },
  ],
  pending_documents: [
    { to: "documents_generated", actors: ["admin", "system"] },
    { to: "cancelled", actors: ["investor", "admin"] },
    { to: "expired", actors: ["admin", "system"] },
  ],
  documents_generated: [
    { to: "awaiting_signature", actors: ["admin", "system"] },
    { to: "pending_documents", actors: ["admin"] }, // regenerate resets
    { to: "cancelled", actors: ["admin"] },
    { to: "expired", actors: ["admin", "system"] },
  ],
  awaiting_signature: [
    // System fires once every signature-required document is executed.
    { to: "awaiting_funds", actors: ["system"] },
    { to: "pending_documents", actors: ["admin"] }, // regenerate resets
    { to: "cancelled", actors: ["admin"] },
    { to: "expired", actors: ["admin", "system"] },
  ],
  awaiting_funds: [
    { to: "funded", actors: ["admin"] },
    { to: "rejected", actors: ["admin"] },
    { to: "cancelled", actors: ["admin"] },
  ],
  funded: [{ to: "closed", actors: ["admin"] }],
  closed: [],
  cancelled: [],
  expired: [],
  rejected: [],
};

/** Admin "advance" convenience map for the happy path. */
export const ADMIN_ADVANCE_MAP: Partial<
  Record<InvestmentClosingStatus, InvestmentClosingStatus>
> = {
  pending_documents: "documents_generated",
  documents_generated: "awaiting_signature",
  awaiting_funds: "funded",
  funded: "closed",
};

export function isClosingStatus(
  status: string
): status is InvestmentClosingStatus {
  return (INVESTMENT_CLOSING_STATUSES as readonly string[]).includes(status);
}

export function isTerminalClosingStatus(status: string): boolean {
  return (
    status === "closed" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "rejected"
  );
}

/**
 * Cancelled / expired / rejected attempts are archived.
 * They keep audit history but do not block a new commitment for the same deal.
 */
export const ARCHIVED_COMMITMENT_STATUSES = [
  "cancelled",
  "expired",
  "rejected",
] as const;

export function isArchivedCommitmentStatus(status: string): boolean {
  return (ARCHIVED_COMMITMENT_STATUSES as readonly string[]).includes(status);
}

/** Blocks a second commitment for the same deal+investor. */
export function isActiveCommitmentStatus(status: string): boolean {
  return !isArchivedCommitmentStatus(status);
}

/** Pre-funding closing workflow (transaction execution). */
export function isPreFundingStatus(status: string): boolean {
  return (
    status === "draft" ||
    status === "pending_documents" ||
    status === "documents_generated" ||
    status === "awaiting_signature" ||
    status === "awaiting_funds"
  );
}

/** Post-funding portfolio administration. */
export function isPortfolioModeStatus(status: string): boolean {
  return (
    status === "funded" ||
    status === "closed" ||
    status === "transferred" ||
    status === "liquidated" ||
    status === "written_off"
  );
}

export const PORTFOLIO_EXIT_STATUSES = [
  "transferred",
  "liquidated",
  "written_off",
] as const;

export function canTransition(
  from: string,
  to: string,
  actor: TransitionActor
): boolean {
  if (!isClosingStatus(from) || !isClosingStatus(to)) {
    return false;
  }
  const rules = CLOSING_TRANSITIONS[from] ?? [];
  return rules.some(
    (rule) => rule.to === to && rule.actors.includes(actor)
  );
}

export function assertTransition(
  from: string,
  to: string,
  actor: TransitionActor
): void {
  if (!canTransition(from, to, actor)) {
    throw new Error(
      `Illegal investment status transition: ${from} → ${to} (actor: ${actor})`
    );
  }
}

export function getNextAdminAdvanceStatus(
  from: string
): InvestmentClosingStatus | null {
  if (!isClosingStatus(from)) return null;
  return ADMIN_ADVANCE_MAP[from] ?? null;
}

/** Display labels for UI. */
export const INVESTMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_documents: "Pending Documents",
  documents_generated: "Documents Generated",
  awaiting_signature: "Awaiting Signature",
  awaiting_funds: "Awaiting Funds",
  funded: "Funded",
  closed: "Closed",
  cancelled: "Cancelled",
  expired: "Expired",
  rejected: "Rejected",
  transferred: "Transferred",
  liquidated: "Liquidated",
  written_off: "Written Off",
  // Legacy labels (pre-migration display fallback)
  committed: "Committed",
  pending: "Pending",
  confirmed: "Confirmed",
};

export const SUBSCRIPTION_DOCUMENT_STATUS_LABELS: Record<string, string> = {
  not_generated: "Not Generated",
  generated: "Generated",
  available: "Available",
  sent: "Sent",
  downloaded: "Downloaded",
  signed: "Signed",
  executed: "Executed",
};

export const SUBSCRIPTION_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  subscription_agreement: "Subscription Agreement",
  operating_agreement: "Operating Agreement",
  investor_questionnaire: "Investor Questionnaire",
  tax_form: "Tax Form",
  wire_instructions: "Wire Instructions",
};

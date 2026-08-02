/**
 * Investment subscription closing domain.
 *
 * Layers:
 * - state-machine / @repo/db/investment-closing — status transitions
 * - services/* — orchestration (commit, package, signatures)
 * - templates/* — {{var}} engine + pdf-lib renderer
 * - signatures/* — SignatureProvider (mock now; DocuSign later)
 * - notifications/* — typed events that enqueue investor emails via the outbox
 *
 * UI calls tRPC `subscriptionClosing` / `investments` only.
 */
export {};

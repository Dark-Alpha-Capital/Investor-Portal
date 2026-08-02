# Subscription Closing Workflow

How a capital commitment moves from "Commit" to "Funded" (and beyond). This is the authoritative reference for the closing state machines, statuses, labels, email triggers, and audit events.

- Canonical source of truth: `packages/db/investment-closing.ts` (statuses, transitions, labels)
- Orchestration: `apps/web/lib/closing/services/` (commit, package, signature)
- Email wiring: `apps/web/lib/closing/notifications/events.ts`
- UI: `apps/web/components/closing/` (investor + admin panels, status chips)

---

## 1. Two separate state machines

Document status and investment status are deliberately decoupled. Documents track the paperwork; the investment tracks the deal. Document changes **react onto** the investment.

### 1a. Investment status (`investment.status`)

Happy path:

```
draft
  │  investor/admin/system commits
  ▼
pending_documents
  │  admin/system generates package
  ▼
documents_generated
  │  admin sends subscription package
  ▼
awaiting_signature
  │  SYSTEM only: all required docs complete
  ▼
awaiting_funds
  │  admin records funds received
  ▼
funded
  │  admin
  ▼
closed
```

Terminal / archived: `cancelled`, `expired`, `rejected`
Exit / portfolio: `transferred`, `liquidated`, `written_off`

### 1b. Document status (`subscription_document.status`)

Two tracks, determined by `signature_required`:

- **Signature docs** (agreement, questionnaire, tax form, …):
  `not_generated → generated → sent → signed → executed`
- **Informational docs** (wire instructions — `signature_required = false`):
  `not_generated → generated → available → downloaded`

`viewed` and `downloaded` are **telemetry, not states** — they are recorded as timestamps + audit events and never gate progress.

### 1c. Package status (`subscription_package.status`)

`pending → generating → ready → sent → completed → superseded`

### 1d. Signature request status (`signature_request.status`)

`pending → sent → signed → declined → voided` (provider-level record)

---

## 2. Document types & per-doc flags

Five document types are seeded per package (`SUBSCRIPTION_DOCUMENT_TYPES`):

| Type (`document_type`) | Label | Default `signature_required` | Default `requires_countersign` |
|---|---|---|---|
| `subscription_agreement` | Subscription Agreement | true | true |
| `operating_agreement` | Operating Agreement | true | true |
| `investor_questionnaire` | Investor Questionnaire | true | false |
| `tax_form` | Tax Form | true | false |
| `wire_instructions` | Wire Instructions | false | false |

- `requires_countersign` (per document, from `document_template.countersign_required`): does the GP need to countersign?
- A doc is **complete** when:
  - `requires_countersign = true` → status `executed` (investor signed **and** GP countersigned)
  - `requires_countersign = false` → status `signed` (investor signature is final)

---

## 3. End-to-end lifecycle with email triggers

| Step | Actor / Action | Service / Mutation | Investment → | Documents → | Email sent to investor |
|---|---|---|---|---|---|
| 1 | Investor commits capital | `investments.commit` → `createCommitment` | `pending_documents` | package created; 5 docs `not_generated` | **No** (investor sees "Preparing subscription package…") |
| 2 | Admin generates package | `subscriptionClosing.generateDocuments` → `generatePackage` | `documents_generated` | each `generated`; package `ready` | **No** (generation is internal — admin reviews first) |
| 3 | Admin sends package | `subscriptionClosing.sendForSignature` → `sendForSignature` | `awaiting_signature` | signature docs `sent`; wire `available`; package `sent` | **YES — email #1 "Action Required: Subscription Documents…"** |
| 4 | Investor signs | `subscriptionClosing.signDocument` → `signDocument` | (unchanged) | doc → `signed` | **No** |
| 5 | Admin countersigns (only if `requires_countersign`) | `subscriptionClosing.countersignDocument` → `countersignDocument` | (unchanged) | doc → `executed` | **No** |
| 6 | All required docs complete (auto, after last sign/countersign) | `checkCompletionAndAdvanceToAwaitingFunds` | `awaiting_funds` (system) | — | **YES — email #2 "documents executed / wire instructions available"** |
| 7 | Admin marks funds received | `investments.recordFunding` → `recordFunding` | `funded` | — | **YES — email #3 "investment funded"** |
| 8 | Admin closes | `investments.advanceStatus` (or closing flow) | `closed` | — | **No** |

### Exactly 3 emails fire (out of all lifecycle events)

Everything else is audit-only (`notification_emitted` row). Mapping from `notifications/events.ts`:

| Notification event | Triggered when investment → | EmailJobType | Subject |
|---|---|---|---|
| `package_sent` | `awaiting_signature` | `closing-package-sent` | `Action Required: Subscription Documents for {dealName}` |
| `documents_executed` | `awaiting_funds` | `closing-documents-executed` | `Your {dealName} subscription documents are executed` |
| `funds_received` | `funded` | `closing-funds-received` | `Your investment in {dealName} has been funded` |

Notes:
- Emails are **dedupe-keyed** per investment per event (`side_effect_outbox.dedupe_key`), so the `documents_executed` email fires exactly once even though many sign/countersign actions each run the completion check.
- `commitment_created`, `documents_ready` (generation), and `investment_closed` are audit-only today — no email template wired.

### Email delivery path

```
lifecycle event (transitionInvestmentStatus → notification port)
  → side_effect_outbox row { queue: "email", jobName, jobId, data }   (dedupe_key)
  → dispatchPendingOutbox()  (needs Worker env binding OUTBOUND_EMAIL_QUEUE)
  → Cloudflare Queue consumer (lib/queues/consume.ts)
  → runOutboundEmailSend (lib/handlers/outbound-email-send.ts)
  → @repo/mail renderEmailTemplate → Resend
```

---

## 4. Telemetry (viewing / downloading) — never a state

| Action | Where recorded | What changes | Audit event |
|---|---|---|---|
| Investor downloads a PDF | download route `GET /api/subscription-documents/download` (no `preview`) | `downloaded_at`, `last_viewed_at`, `opened_count++`; **status unchanged** | `document_downloaded` (+ userAgent) |
| Admin **Preview** (inline tab) | same route with `?preview=1` | `viewed_at`, `last_viewed_at`, `opened_count++`; **status unchanged** | `document_viewed` |
| Investor view / open | `subscriptionClosing.markViewed` | `viewed_at`, `last_viewed_at`, `opened_count++`; **status unchanged** | `document_viewed` |

**Release gating**: the download/preview route returns 403 for investors unless investment status is one of
`awaiting_signature`, `awaiting_funds`, `funded`, `closed`. Admins are always allowed.

---

## 5. Transition table (exact, from `CLOSING_TRANSITIONS`)

| From | To | Allowed actors |
|---|---|---|
| `draft` | `pending_documents` | investor, admin, system |
| `draft` | `cancelled` | investor, admin |
| `draft` | `expired` | admin, system |
| `pending_documents` | `documents_generated` | admin, system |
| `pending_documents` | `cancelled` | investor, admin |
| `pending_documents` | `expired` | admin, system |
| `documents_generated` | `awaiting_signature` | admin, system |
| `documents_generated` | `pending_documents` (regenerate reset) | admin |
| `documents_generated` | `cancelled` | admin |
| `documents_generated` | `expired` | admin, system |
| `awaiting_signature` | `awaiting_funds` (all docs complete) | **system only** |
| `awaiting_signature` | `pending_documents` (regenerate reset) | admin |
| `awaiting_signature` | `cancelled` | admin |
| `awaiting_signature` | `expired` | admin, system |
| `awaiting_funds` | `funded` | admin |
| `awaiting_funds` | `rejected` | admin |
| `awaiting_funds` | `cancelled` | admin |
| `funded` | `closed` | admin |
| `closed` / `cancelled` / `expired` / `rejected` | — | terminal |

Admin "advance" convenience map (`ADMIN_ADVANCE_MAP`):
`pending_documents → documents_generated`, `documents_generated → awaiting_signature`, `awaiting_funds → funded`, `funded → closed`.

---

## 6. Status labels (exact, from `investment-closing.ts`)

Investment:

| Status | Label |
|---|---|
| `draft` | Draft |
| `pending_documents` | Pending Documents |
| `documents_generated` | Documents Generated |
| `awaiting_signature` | Awaiting Signature |
| `awaiting_funds` | Awaiting Funds |
| `funded` | Funded |
| `closed` | Closed |
| `cancelled` | Cancelled |
| `expired` | Expired |
| `rejected` | Rejected |
| `transferred` | Transferred |
| `liquidated` | Liquidated |
| `written_off` | Written Off |

Document:

| Status | Label |
|---|---|
| `not_generated` | Not Generated |
| `generated` | Generated |
| `available` | Available |
| `sent` | Sent |
| `downloaded` | Downloaded |
| `signed` | Signed |
| `executed` | Executed |

---

## 7. Audit events (`CLOSING_EVENT_TYPES`)

`commitment_created`, `package_created`, `status_changed`, `package_generated`, `package_regenerated`, `document_generated`, `document_replacement_uploaded`, `signature_requested`, `document_viewed`, `document_downloaded`, `document_signed`, `document_countersigned`, `package_fully_signed`, `funds_required`, `funds_received`, `investment_closed`, `commitment_cancelled`, `commitment_rejected`, `commitment_expired`, `admin_approved`, `notification_emitted`

---

## 8. Key rules / guardrails

- Only the **system** advances `awaiting_signature → awaiting_funds` (no admin approve button).
- Investors can cancel only at `draft` / `pending_documents`; admins can cancel up to `awaiting_funds`.
- `cancelled` / `expired` / `rejected` archive the commitment — the investor can recommit to the same deal (active-commitment uniqueness is enforced in app code, not a DB constraint).
- `document_generation_job` tracks generate/regenerate attempts; package status returns to `pending` and the job is marked `failed` on error.
- Regenerating from `documents_generated` / `awaiting_signature` resets to `pending_documents`, bumps document `version`, and re-releases only after admin sends again.

---

## 9. Local testing

```bash
# investment + package + documents state
bunx wrangler d1 execute dac-investor-portal --local --command \
  "SELECT i.status, sp.status pkg, sd.document_type, sd.status, sd.signature_required, sd.requires_countersign, sd.opened_count, sd.downloaded_at
   FROM investment i
   JOIN subscription_package sp ON sp.investment_id=i.id
   JOIN subscription_document sd ON sd.package_id=sp.id
   WHERE i.id='<INVESTMENT_ID>';"

# emails enqueued / dispatched
bunx wrangler d1 execute dac-investor-portal --local --command \
  "SELECT id, status, json_extract(payload,'$.jobName') job, dedupe_key FROM side_effect_outbox ORDER BY created_at DESC;"

# audit trail for a commitment
bunx wrangler d1 execute dac-investor-portal --local --command \
  "SELECT event_type, created_at, payload FROM investment_closing_event WHERE investment_id='<INVESTMENT_ID>' ORDER BY created_at;"
```

Unit tests: `bun test` from `apps/web` (state machine + template engine in `lib/closing/`).

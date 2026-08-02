/**
 * Simulate an OpenSign webhook against a running portal (no tunnel needed).
 *
 * Usage (from apps/web):
 *   bun run scripts/opensign-webhook-sim.ts --event document.signed --doc <externalId> --email investor@example.com
 *   bun run scripts/opensign-webhook-sim.ts --event document.completed --doc <externalId>
 *   bun run scripts/opensign-webhook-sim.ts --event document.viewed --doc <externalId> --email investor@example.com
 *   bun run scripts/opensign-webhook-sim.ts --event document.declined --doc <externalId> --email investor@example.com
 *
 * Env: OPEN_SIGN_WEBHOOK_SECRET must match the portal's. Target defaults to
 * http://localhost:3000/api/webhooks/opensign (override with --url).
 */
export { };

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const eventType = flag("event") ?? "document.signed";
const documentId = flag("doc");
const signerEmail = flag("email");
const target =
  flag("url") ?? "http://localhost:3000/api/webhooks/opensign";

if (!documentId) {
  console.error("--doc <OpenSign documentId / signature_request.externalId> is required");
  process.exit(1);
}

const now = new Date().toISOString();
const payload: Record<string, unknown> = { event: eventType, documentId };

switch (eventType) {
  case "document.viewed":
    payload.signerEmail = signerEmail ?? "investor@example.com";
    payload.ipAddress = "203.0.113.7";
    payload.viewedAt = now;
    break;
  case "document.signed":
    payload.signerEmail = signerEmail ?? "investor@example.com";
    payload.signedUrl = `https://sign.darkalphacapital.com/signed/${documentId}.pdf`;
    payload.signedAt = now;
    break;
  case "document.completed":
    payload.signedUrl = `https://sign.darkalphacapital.com/signed/${documentId}.pdf`;
    payload.completedAt = now;
    payload.documentHash = "sha256:deadbeef";
    break;
  case "document.declined":
    payload.signerEmail = signerEmail ?? "investor@example.com";
    payload.declineReason = "Investor declined the document";
    payload.declinedByUserId = "sim";
    payload.declinedAt = now;
    break;
  default:
    console.error(`Unknown event: ${eventType}`);
    process.exit(1);
}

const body = new TextEncoder().encode(JSON.stringify(payload));
const secret = process.env.OPEN_SIGN_WEBHOOK_SECRET;
if (!secret) {
  console.error("OPEN_SIGN_WEBHOOK_SECRET is not set");
  process.exit(1);
}

const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const sig = await crypto.subtle.sign("HMAC", key, body);
const signature = Array.from(new Uint8Array(sig))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

console.log(`POST ${target}`);
console.log(`  event=${event} doc=${documentId} signer=${signerEmail ?? "-"}`);

const resp = await fetch(target, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-OpenSign-Signature": signature,
  },
  body: body,
});
const text = await resp.text();
console.log(`  -> ${resp.status} ${text}`);

if (resp.status !== 200) {
  process.exit(1);
}

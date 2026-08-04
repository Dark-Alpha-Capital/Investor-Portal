/**
 * Live OpenSign round-trip validation (requires real credentials in env).
 *
 * Usage (from apps/web):
 *   bun run scripts/opensign-roundtrip.ts [--email you@example.com]
 *
 * Required env: OPEN_SIGN_BASE_URL, OPEN_SIGN_USERNAME, OPEN_SIGN_PASSWORD,
 * OPEN_SIGN_TENANT_ID, OPEN_SIGN_SENDER_USERS_PTR, OPEN_SIGN_LOGIN_USER_PTR.
 *
 * Validates: login → savecontact (incl. duplicate/137) → upload → create doc →
 * signing link → getdocument/getsigners. Creates a real document in OpenSign.
 */
import {
  buildOpenSignSigningLink,
  createOpenSignDocument,
  ensureOpenSignContact,
  fetchOpenSignDocumentState,
  uploadOpenSignPdf,
} from "../lib/closing/signatures/opensign-provider";

const args = process.argv.slice(2);
const email = args.find((a) => a.startsWith("--email="))?.split("=")[1] ??
  `roundtrip+${Date.now()}@example.com`;
const name = "Round Trip Tester";

for (const key of [
  "OPEN_SIGN_BASE_URL",
  "OPEN_SIGN_USERNAME",
  "OPEN_SIGN_PASSWORD",
  "OPEN_SIGN_TENANT_ID",
  "OPEN_SIGN_SENDER_USERS_PTR",
  "OPEN_SIGN_LOGIN_USER_PTR",
]) {
  if (!process.env[key]) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
}

const log = (label: string, value: unknown) =>
  console.log(`${label}: ${JSON.stringify(value)}`);

// 1. Contact (twice to prove 137 reuse)
const contactA = await ensureOpenSignContact({ email, name });
log("contact #1", contactA);
const contactB = await ensureOpenSignContact({ email, name });
log("contact #2 (reuse)", contactB);

// 2. Upload a minimal PDF
const minimalPdf = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF\n",
);
const uploaded = await uploadOpenSignPdf(
  new Uint8Array(minimalPdf),
  `roundtrip_${Date.now()}.pdf`,
);
log("uploaded", uploaded);

// 3. Create the signature request
const docId = await createOpenSignDocument({
  name: `Round Trip - ${name}`,
  url: uploaded.url,
  signerContactIds: [contactB],
  senderUsersPtr: process.env.OPEN_SIGN_SENDER_USERS_PTR!,
  createdByPtr: process.env.OPEN_SIGN_LOGIN_USER_PTR!,
});
log("documentId", docId);

// 4. Signing link
const link = buildOpenSignSigningLink(docId, email, contactB);
log("signing link", link);

// 5. Status (completion check — signedUrl appears once fully signed)
const state = await fetchOpenSignDocumentState(docId);
log("document state", {
  signedUrl: state.signedUrl,
  fullySigned: Boolean(state.signedUrl),
});

console.log("\nRound-trip complete. Open the signing link to sign manually.");

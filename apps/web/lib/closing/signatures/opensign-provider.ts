import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  signatureRequest,
  subscriptionDocument,
  subscriptionPackage,
  user,
} from "@repo/db/schema";
import { SUBSCRIPTION_DOCUMENT_TYPE_LABELS } from "@repo/db/investment-closing";
import { createNextcloudClientFromEnv, getFileContents } from "@repo/nextcloud";
import type {
  CreateSignatureRequestInput,
  SignatureProvider,
  SignatureRequestRecord,
} from "./types";

type Db = DrizzleD1Database<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Config + session cache (token valid ~1 year; re-login on 401)
// ---------------------------------------------------------------------------

const TOKEN_CACHE_MS = 60 * 60 * 24 * 30; // 30d hard cap, auto-extends with use
let cachedToken: string | null = null;
let cachedTokenAt = 0;

function opensignEnv() {
  const baseUrl = process.env.OPEN_SIGN_BASE_URL;
  const appId = process.env.OPEN_SIGN_APP_ID ?? "opensign";
  const username = process.env.OPEN_SIGN_USERNAME;
  const password = process.env.OPEN_SIGN_PASSWORD;
  const tenantId = process.env.OPEN_SIGN_TENANT_ID;
  const senderUsersPtr = process.env.OPEN_SIGN_SENDER_USERS_PTR;
  const loginUserPtr = process.env.OPEN_SIGN_LOGIN_USER_PTR;
  if (!baseUrl) {
    throw new Error("OPEN_SIGN_BASE_URL is not configured");
  }
  return { baseUrl, appId, username, password, tenantId, senderUsersPtr, loginUserPtr };
}

function requireCreds(env: ReturnType<typeof opensignEnv>) {
  if (!env.username || !env.password) {
    throw new Error("OPEN_SIGN_USERNAME / OPEN_SIGN_PASSWORD are not configured");
  }
}

function pickObjectId(
  body: unknown,
  keys: string[] = ["objectId"],
): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  for (const key of keys) {
    const val = b[key];
    if (typeof val === "string") return val;
  }
  const result = b.result;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    for (const key of keys) {
      if (typeof r[key] === "string") return r[key] as string;
    }
  }
  const doc = b.document;
  if (doc && typeof doc === "object") {
    const d = doc as Record<string, unknown>;
    for (const key of keys) {
      if (typeof d[key] === "string") return d[key] as string;
    }
  }
  const results = b.results;
  if (Array.isArray(results) && results[0] && typeof results[0] === "object") {
    const first = results[0] as Record<string, unknown>;
    for (const key of keys) {
      if (typeof first[key] === "string") return first[key] as string;
    }
  }
  return null;
}

async function jsonOrThrow(resp: Response, label: string): Promise<unknown> {
  const text = await resp.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!resp.ok) {
    const code =
      json && typeof json === "object"
        ? (json as Record<string, unknown>).code
        : undefined;
    const message =
      json && typeof json === "object"
        ? (json as Record<string, unknown>).error
        : text;
    throw new Error(
      `OpenSign ${label} failed (${resp.status}) code=${code ?? "n/a"} message=${message ?? "unknown"}`,
    );
  }
  return json;
}

async function login(): Promise<string> {
  const env = opensignEnv();
  requireCreds(env);
  if (cachedToken && Date.now() - cachedTokenAt < TOKEN_CACHE_MS) {
    return cachedToken;
  }
  const resp = await fetch(`${env.baseUrl}/api/app/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Parse-Application-Id": env.appId,
    },
    body: JSON.stringify({ username: env.username, password: env.password }),
  });
  const json = await jsonOrThrow(resp, "login");
  const token = pickObjectId(json, ["sessionToken"]);
  if (!token) {
    throw new Error("OpenSign login did not return a sessionToken");
  }
  cachedToken = token;
  cachedTokenAt = Date.now();
  return token;
}

async function api(
  path: string,
  init: {
    method?: string;
    body?: BodyInit | null;
    headers?: Record<string, string>;
  } = {},
  retried = false,
): Promise<Response> {
  const env = opensignEnv();
  const token = await login();
  const resp = await fetch(`${env.baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body && typeof init.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      "X-Parse-Application-Id": env.appId,
      "X-Parse-Session-Token": token,
      ...init.headers,
    },
    body: init.body ?? null,
  });
  if (resp.status === 401 && !retried) {
    cachedToken = null;
    cachedTokenAt = 0;
    return api(path, init, true);
  }
  return resp;
}

// ---------------------------------------------------------------------------
// Contact management (portal-created contacts; error 137 = already exists)
// ---------------------------------------------------------------------------

const contactCache = new Map<string, string>();

export async function ensureOpenSignContact(
  input: { email: string; name: string; phone?: string; company?: string; jobTitle?: string },
): Promise<string> {
  const env = opensignEnv();
  const key = input.email.toLowerCase();
  const cached = contactCache.get(key);
  if (cached) return cached;

  if (!env.tenantId) {
    throw new Error("OPEN_SIGN_TENANT_ID is not configured");
  }

  const resp = await api("/api/app/functions/savecontact", {
    method: "POST",
    body: JSON.stringify({
      name: input.name || input.email,
      email: input.email,
      tenantId: env.tenantId,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.company ? { company: input.company } : {}),
      ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    }),
  });
  const json = await jsonOrThrow(resp, "savecontact");
  const code = (json as Record<string, unknown>).code;

  if (code === 137) {
    // Already exists — look it up.
    const where = encodeURIComponent(JSON.stringify({ Email: input.email }));
    const listResp = await api(
      `/classes/contracts_Contactbook?where=${where}&limit=1`,
    );
    const list = (await jsonOrThrow(listResp, "contact lookup")) as {
      results?: Array<{ objectId: string }>;
    };
    const objectId = list.results?.[0]?.objectId ?? null;
    if (!objectId) {
      throw new Error(`OpenSign contact exists but could not be resolved for ${input.email}`);
    }
    contactCache.set(key, objectId);
    return objectId;
  }

  const objectId = pickObjectId(json);
  if (!objectId) {
    throw new Error(`OpenSign savecontact did not return an objectId for ${input.email}`);
  }
  contactCache.set(key, objectId);
  return objectId;
}

// ---------------------------------------------------------------------------
// PDF upload + document creation
// ---------------------------------------------------------------------------

export async function uploadOpenSignPdf(
  pdfBytes: Uint8Array,
  fileName: string,
): Promise<{ url: string }> {
  const resp = await api(`/api/app/files/${encodeURIComponent(fileName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: pdfBytes as unknown as BodyInit,
  });
  const json = (await jsonOrThrow(resp, "file upload")) as Record<string, unknown>;
  if (typeof json.url !== "string") {
    throw new Error("OpenSign file upload did not return a URL");
  }
  return { url: json.url };
}

export async function createOpenSignDocument(input: {
  name: string;
  url: string;
  signerContactIds: string[];
  senderUsersPtr: string;
  createdByPtr: string;
}): Promise<string> {
  const env = opensignEnv();
  if (!env.senderUsersPtr || !env.loginUserPtr) {
    throw new Error("OPEN_SIGN_SENDER_USERS_PTR / OPEN_SIGN_LOGIN_USER_PTR are not configured");
  }
  const body = {
    document: {
      Name: input.name,
      URL: input.url,
      ExtUserPtr: {
        __type: "Pointer",
        className: "contracts_Users",
        objectId: input.senderUsersPtr || env.senderUsersPtr,
      },
      CreatedBy: {
        __type: "Pointer",
        className: "_User",
        objectId: input.createdByPtr || env.loginUserPtr,
      },
      Signers: input.signerContactIds.map((objectId) => ({
        __type: "Pointer",
        className: "contracts_Contactbook",
        objectId,
      })),
      SignatureType: [
        { name: "draw", enabled: true },
        { name: "typed", enabled: true },
      ],
      TimeToCompleteDays: 15,
      NotifyOnSignatures: true,
      SendinOrder: input.signerContactIds.length > 1,
    },
  };
  const resp = await api("/api/app/functions/createdocumentfromapp", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const json = await jsonOrThrow(resp, "createdocumentfromapp");
  const docId = pickObjectId(json, ["objectId", "documentId"]);
  if (!docId) {
    throw new Error("OpenSign createdocumentfromapp did not return a document objectId");
  }
  return docId;
}

// ---------------------------------------------------------------------------
// Signing link
// ---------------------------------------------------------------------------

/** raw = "<docId>/<signerEmail>/<contactObjectId>" → base64 → login URL */
export function buildOpenSignSigningLink(
  docId: string,
  signerEmail: string,
  contactObjectId: string,
): string {
  const env = opensignEnv();
  const raw = `${docId}/${signerEmail}/${contactObjectId}`;
  const encoded = Buffer.from(raw, "utf8").toString("base64");
  return `${env.baseUrl}/login/${encoded}`;
}

// ---------------------------------------------------------------------------
// Status / state fetch (used by fallback reconcile)
// ---------------------------------------------------------------------------

export type OpenSignDocumentState = {
  docId: string;
  signedUrl: string | null;
};

/**
 * Completion check for the fallback reconcile. This OpenSign build has no
 * `getdocument`; `getsignedurl` returns the executed PDF URL once fully signed
 * and `{}` while unsigned. Per-signer status comes from webhooks instead.
 */
export async function fetchOpenSignDocumentState(
  docId: string,
): Promise<OpenSignDocumentState> {
  const resp = await api("/api/app/functions/getsignedurl", {
    method: "POST",
    body: JSON.stringify({ docId }),
  });
  const json = await jsonOrThrow(resp, "getsignedurl");

  let signedUrl: string | null = null;
  if (json && typeof json === "object") {
    const b = json as Record<string, unknown>;
    signedUrl =
      [b.url, b.signedUrl, b.SignedUrl, b.presignedUrl].find(
        (v): v is string => typeof v === "string",
      ) ?? null;
  } else if (typeof json === "string") {
    signedUrl = json;
  }

  return { docId, signedUrl };
}

// ---------------------------------------------------------------------------
// Re-hosting the executed PDF to Nextcloud so existing download infra works
// ---------------------------------------------------------------------------

export async function rehostSignedPdfToNextcloud(
  db: Db,
  input: { documentId: string; signedUrl: string },
): Promise<string | null> {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, input.documentId))
    .limit(1);
  if (!doc) return null;

  const fileResp = await fetch(input.signedUrl);
  if (!fileResp.ok) {
    console.error(
      `[opensign] failed to fetch signed PDF from ${input.signedUrl}: ${fileResp.status}`,
    );
    return null;
  }
  const bytes = new Uint8Array(await fileResp.arrayBuffer());
  const client = createNextcloudClientFromEnv();
  const folder = doc.pdfPath ? doc.pdfPath.substring(0, doc.pdfPath.lastIndexOf("/")) : "/";
  const path = `${folder}/${doc.documentType}_signed_v${doc.version}.pdf`;
  const nc = await import("@repo/nextcloud");
  await nc.ensureDirectory(client, folder);
  await nc.uploadBuffer(client, path, Buffer.from(bytes));
  return path;
}

// ---------------------------------------------------------------------------
// Provider (implements the SignatureProvider port)
// ---------------------------------------------------------------------------

function mapRow(
  row: typeof signatureRequest.$inferSelect,
): SignatureRequestRecord {
  return {
    id: row.id,
    documentId: row.documentId,
    provider: row.provider as SignatureRequestRecord["provider"],
    externalId: row.externalId,
    signerUserId: row.signerUserId,
    signerRole: row.signerRole as SignatureRequestRecord["signerRole"],
    status: row.status as SignatureRequestRecord["status"],
    sentAt: row.sentAt,
    viewedAt: row.viewedAt,
    signedAt: row.signedAt,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

async function loadDoc(db: Db, documentId: string) {
  const [doc] = await db
    .select()
    .from(subscriptionDocument)
    .where(eq(subscriptionDocument.id, documentId))
    .limit(1);
  if (!doc) throw new Error("Document not found");
  return doc;
}

async function loadPkg(db: Db, packageId: string) {
  const [pkg] = await db
    .select()
    .from(subscriptionPackage)
    .where(eq(subscriptionPackage.id, packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found");
  return pkg;
}

async function loadUser(db: Db, userId: string) {
  const [u] = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!u) throw new Error("User not found");
  return u;
}

async function fetchPdfFromNextcloud(pdfPath: string | null): Promise<Uint8Array> {
  if (!pdfPath) throw new Error("Document has no PDF yet");
  const client = createNextcloudClientFromEnv();
  return getFileContents(client, pdfPath);
}

export function createOpenSignProvider(db: Db): SignatureProvider {
  return {
    name: "opensign",

    async createRequest(input: CreateSignatureRequestInput) {
      const doc = await loadDoc(db, input.documentId);
      const pkg = await loadPkg(db, doc.packageId);
      const signerUser = await loadUser(db, input.signerUserId);
      const requiresCountersign = doc.requiresCountersign;
      const countersignerUserId =
        (input.metadata?.countersignerUserId as string | undefined) ?? null;

      const investorContactId = await ensureOpenSignContact({
        email: signerUser.email,
        name: signerUser.name,
      });

      let gpUser: { id: string; email: string; name: string } | null = null;
      let gpContactId: string | null = null;
      if (requiresCountersign && countersignerUserId) {
        gpUser = await loadUser(db, countersignerUserId);
        gpContactId = await ensureOpenSignContact({
          email: gpUser.email,
          name: gpUser.name,
        });
      }

      const pdfBytes = await fetchPdfFromNextcloud(doc.pdfPath);
      const fileName = `${doc.documentType}_v${doc.version}.pdf`;
      const uploaded = await uploadOpenSignPdf(pdfBytes, fileName);

      const label = SUBSCRIPTION_DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType;
      const signerContactIds = gpContactId
        ? [investorContactId, gpContactId]
        : [investorContactId];
      const docId = await createOpenSignDocument({
        name: `${label} - ${signerUser.name}`,
        url: uploaded.url,
        signerContactIds,
        senderUsersPtr: process.env.OPEN_SIGN_SENDER_USERS_PTR ?? "",
        createdByPtr: process.env.OPEN_SIGN_LOGIN_USER_PTR ?? "",
      });

      const now = new Date();
      const investorReqId = randomUUID();
      const investorLink = buildOpenSignSigningLink(
        docId,
        signerUser.email,
        investorContactId,
      );
      await db.insert(signatureRequest).values({
        id: investorReqId,
        documentId: input.documentId,
        provider: "opensign",
        externalId: docId,
        signerUserId: input.signerUserId,
        signerRole: "investor",
        status: "sent",
        sentAt: now,
        metadata: {
          signingUrl: investorLink,
          signerEmail: signerUser.email,
          contactId: investorContactId,
        },
      });

      if (gpContactId && gpUser) {
        const gpLink = buildOpenSignSigningLink(docId, gpUser.email, gpContactId);
        await db.insert(signatureRequest).values({
          id: randomUUID(),
          documentId: input.documentId,
          provider: "opensign",
          externalId: docId,
          signerUserId: gpUser.id,
          signerRole: "admin_countersign",
          status: "sent",
          sentAt: now,
          metadata: {
            signingUrl: gpLink,
            signerEmail: gpUser.email,
            contactId: gpContactId,
          },
        });
      }

      const [row] = await db
        .select()
        .from(signatureRequest)
        .where(eq(signatureRequest.id, investorReqId))
        .limit(1);
      return mapRow(row);
    },

    async markViewed(requestId: string) {
      // Telemetry arrives via OpenSign webhooks; local provider is a no-op.
      const [row] = await db
        .select()
        .from(signatureRequest)
        .where(eq(signatureRequest.id, requestId))
        .limit(1);
      if (!row) throw new Error(`Signature request not found: ${requestId}`);
      return mapRow(row);
    },

    async markSigned() {
      throw new Error(
        "Signing happens in OpenSign via the signing link; the portal is notified by webhook.",
      );
    },

    async getStatus(requestId: string) {
      const [row] = await db
        .select()
        .from(signatureRequest)
        .where(eq(signatureRequest.id, requestId))
        .limit(1);
      if (!row) throw new Error(`Signature request not found: ${requestId}`);
      return mapRow(row);
    },
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

export async function verifyOpenSignWebhookSignature(
  body: ArrayBuffer | Uint8Array,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = process.env.OPEN_SIGN_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    (body instanceof Uint8Array ? body : new Uint8Array(body)) as BufferSource,
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqualHex(expected, signatureHeader.trim().toLowerCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

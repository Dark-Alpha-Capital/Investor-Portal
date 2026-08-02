import { describe, expect, test } from "bun:test";
import {
  buildOpenSignSigningLink,
  verifyOpenSignWebhookSignature,
} from "./opensign-provider";

describe("OpenSign signing link", () => {
  test("builds base64(docId/email/contactId) URL", () => {
    process.env.OPEN_SIGN_BASE_URL = "https://sign.darkalphacapital.com";
    const link = buildOpenSignSigningLink(
      "ckLmybK27K",
      "keith@darkalphacapital.com",
      "uOG92t1e4m",
    );
    const raw = "ckLmybK27K/keith@darkalphacapital.com/uOG92t1e4m";
    const expected =
      `https://sign.darkalphacapital.com/login/` +
      Buffer.from(raw, "utf8").toString("base64");
    expect(link).toBe(expected);
  });
});

describe("OpenSign webhook signature", () => {
  const SECRET = "test-secret-value";

  async function sign(
    secret: string,
    body: Uint8Array,
  ): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      body as BufferSource,
    );
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  test("accepts a valid signature", async () => {
    process.env.OPEN_SIGN_WEBHOOK_SECRET = SECRET;
    const body = new TextEncoder().encode(
      JSON.stringify({ event: "document.signed", documentId: "abc" }),
    );
    const expected = await sign(SECRET, body);
    expect(await verifyOpenSignWebhookSignature(body, expected)).toBe(true);
  });

  test("rejects a tampered signature", async () => {
    process.env.OPEN_SIGN_WEBHOOK_SECRET = SECRET;
    const body = new TextEncoder().encode(
      JSON.stringify({ event: "document.signed", documentId: "abc" }),
    );
    const wrong = await sign("different-secret", body);
    expect(await verifyOpenSignWebhookSignature(body, wrong)).toBe(false);
  });

  test("rejects missing secret or header", async () => {
    delete process.env.OPEN_SIGN_WEBHOOK_SECRET;
    const body = new TextEncoder().encode("{}");
    expect(await verifyOpenSignWebhookSignature(body, "anything")).toBe(false);
    process.env.OPEN_SIGN_WEBHOOK_SECRET = SECRET;
    expect(await verifyOpenSignWebhookSignature(body, null)).toBe(false);
  });
});

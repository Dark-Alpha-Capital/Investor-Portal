import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SignatureProvider } from "./types";
import { createMockSignatureProvider } from "./mock-provider";
import { createOpenSignProvider } from "./opensign-provider";

/**
 * Selects the active signature provider at runtime.
 * When OPEN_SIGN_BASE_URL is configured, signing is handled by OpenSign
 * (signing links delivered by the portal + webhook status sync); otherwise the
 * in-app mock provider is used.
 */
export function createSignatureProvider(
  db: DrizzleD1Database<Record<string, unknown>>,
): SignatureProvider {
  if (process.env.OPEN_SIGN_BASE_URL) {
    return createOpenSignProvider(db);
  }
  return createMockSignatureProvider(db);
}

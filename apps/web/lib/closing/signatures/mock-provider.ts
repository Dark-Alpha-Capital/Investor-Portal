import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { signatureRequest } from "@repo/db/schema";
import type {
  CreateSignatureRequestInput,
  SignatureProvider,
  SignatureRequestRecord,
} from "./types";

type Db = DrizzleD1Database<Record<string, unknown>>;

function mapRow(
  row: typeof signatureRequest.$inferSelect
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

/**
 * In-app mock signature provider. Persists to `signature_request`.
 */
export function createMockSignatureProvider(db: Db): SignatureProvider {
  return {
    name: "mock",

    async createRequest(input: CreateSignatureRequestInput) {
      const id = randomUUID();
      const now = new Date();
      const externalId = `mock_${id.slice(0, 8)}`;
      const [row] = await db
        .insert(signatureRequest)
        .values({
          id,
          documentId: input.documentId,
          provider: "mock",
          externalId,
          signerUserId: input.signerUserId,
          signerRole: input.signerRole,
          status: "sent",
          sentAt: now,
          metadata: input.metadata ?? null,
        })
        .returning();
      return mapRow(row);
    },

    async markViewed(requestId: string) {
      const now = new Date();
      const [row] = await db
        .update(signatureRequest)
        .set({
          viewedAt: now,
        })
        .where(eq(signatureRequest.id, requestId))
        .returning();
      if (!row) {
        throw new Error(`Signature request not found: ${requestId}`);
      }
      return mapRow(row);
    },

    async markSigned(requestId: string, metadata?: Record<string, unknown>) {
      const now = new Date();
      const [existing] = await db
        .select()
        .from(signatureRequest)
        .where(eq(signatureRequest.id, requestId))
        .limit(1);
      if (!existing) {
        throw new Error(`Signature request not found: ${requestId}`);
      }
      const merged = {
        ...((existing.metadata as Record<string, unknown> | null) ?? {}),
        ...(metadata ?? {}),
      };
      const [row] = await db
        .update(signatureRequest)
        .set({
          status: "signed",
          signedAt: now,
          viewedAt: existing.viewedAt ?? now,
          metadata: merged,
        })
        .where(eq(signatureRequest.id, requestId))
        .returning();
      return mapRow(row);
    },

    async getStatus(requestId: string) {
      const [row] = await db
        .select()
        .from(signatureRequest)
        .where(eq(signatureRequest.id, requestId))
        .limit(1);
      return row ? mapRow(row) : null;
    },
  };
}

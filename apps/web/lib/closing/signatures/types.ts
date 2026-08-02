export type SignatureProviderName =
  | "mock"
  | "opensign"
  | "docusign"
  | "dropbox_sign";

export type SignatureSignerRole = "investor" | "admin_countersign";

export type SignatureRequestStatus =
  | "pending"
  | "sent"
  | "signed"
  | "declined"
  | "voided";

export type CreateSignatureRequestInput = {
  documentId: string;
  signerUserId: string;
  signerRole: SignatureSignerRole;
  metadata?: Record<string, unknown>;
};

export type SignatureRequestRecord = {
  id: string;
  documentId: string;
  provider: SignatureProviderName;
  externalId: string | null;
  signerUserId: string;
  signerRole: SignatureSignerRole;
  status: SignatureRequestStatus;
  sentAt: Date | null;
  viewedAt: Date | null;
  signedAt: Date | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Provider-agnostic signature port. DocuSign / Dropbox Sign can implement this
 * without changing subscription closing orchestration.
 */
export interface SignatureProvider {
  readonly name: SignatureProviderName;
  createRequest(
    input: CreateSignatureRequestInput
  ): Promise<SignatureRequestRecord>;
  /** Telemetry only — records a viewedAt timestamp, never changes request status. */
  markViewed(requestId: string): Promise<SignatureRequestRecord>;
  markSigned(
    requestId: string,
    metadata?: Record<string, unknown>
  ): Promise<SignatureRequestRecord>;
  getStatus(requestId: string): Promise<SignatureRequestRecord | null>;
}

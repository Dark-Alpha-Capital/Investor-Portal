/**
 * Audit Logging Utility
 *
 * Provides functions to log audit events for compliance tracking.
 * All permission changes, clearance decisions, and sensitive operations
 * are logged here for audit trail purposes.
 */

import { db } from "@repo/db";
import { auditLog } from "@repo/db/schema";
import { nanoid } from "nanoid";

// Audit action types (must match the audit_action_enum in schema)
export type AuditAction =
  | "user_created"
  | "user_updated"
  | "role_granted"
  | "role_revoked"
  | "clearance_set"
  | "permission_granted"
  | "permission_revoked"
  | "document_uploaded"
  | "document_published"
  | "document_superseded"
  | "document_reviewed"
  | "capital_notice_created"
  | "capital_notice_approved"
  | "capital_notice_sent"
  | "banking_change_requested"
  | "banking_change_verified"
  | "banking_change_rejected"
  | "login_success"
  | "login_failed"
  | "session_expired";

// Target types for audit logs
export type AuditTargetType =
  | "user"
  | "clearance"
  | "permission"
  | "document"
  | "deal"
  | "capital_notice"
  | "banking"
  | "session";

// Audit event input
export type AuditEventInput = {
  userId?: string | null; // User who performed the action (null for system actions)
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(event: AuditEventInput): Promise<string> {
  const id = nanoid();

  await db.insert(auditLog).values({
    id,
    userId: event.userId ?? null,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    previousValue: event.previousValue ?? null,
    newValue: event.newValue ?? null,
    metadata: event.metadata ?? null,
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null,
  });

  return id;
}

/**
 * Helper to log clearance status changes
 */
export async function logClearanceChange(params: {
  performedBy: string;
  targetUserId: string;
  previousStatus?: string | null;
  newStatus: string;
  conditions?: string[] | null;
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  return logAuditEvent({
    userId: params.performedBy,
    action: "clearance_set",
    targetType: "clearance",
    targetId: params.targetUserId,
    previousValue: params.previousStatus
      ? { status: params.previousStatus }
      : null,
    newValue: {
      status: params.newStatus,
      conditions: params.conditions ?? null,
    },
    metadata: params.notes ? { notes: params.notes } : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper to log vehicle permission grants
 */
export async function logPermissionGrant(params: {
  performedBy: string;
  targetUserId: string;
  dealId: string;
  permissions: {
    canViewTeaser: boolean;
    canViewDocuments: boolean;
    canExpressInterest: boolean;
    canInvest: boolean;
  };
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  return logAuditEvent({
    userId: params.performedBy,
    action: "permission_granted",
    targetType: "permission",
    targetId: `${params.targetUserId}:${params.dealId}`,
    newValue: {
      userId: params.targetUserId,
      dealId: params.dealId,
      ...params.permissions,
    },
    metadata: params.notes ? { notes: params.notes } : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper to log vehicle permission revocations
 */
export async function logPermissionRevoke(params: {
  performedBy: string;
  targetUserId: string;
  dealId: string;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  return logAuditEvent({
    userId: params.performedBy,
    action: "permission_revoked",
    targetType: "permission",
    targetId: `${params.targetUserId}:${params.dealId}`,
    previousValue: {
      userId: params.targetUserId,
      dealId: params.dealId,
    },
    metadata: params.reason ? { reason: params.reason } : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper to log role grants
 */
export async function logRoleGrant(params: {
  performedBy: string;
  targetUserId: string;
  role: string;
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  return logAuditEvent({
    userId: params.performedBy,
    action: "role_granted",
    targetType: "user",
    targetId: params.targetUserId,
    newValue: { role: params.role },
    metadata: params.notes ? { notes: params.notes } : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Helper to log role revocations
 */
export async function logRoleRevoke(params: {
  performedBy: string;
  targetUserId: string;
  role: string;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  return logAuditEvent({
    userId: params.performedBy,
    action: "role_revoked",
    targetType: "user",
    targetId: params.targetUserId,
    previousValue: { role: params.role },
    metadata: params.reason ? { reason: params.reason } : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}


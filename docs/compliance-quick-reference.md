# Compliance System Quick Reference

## tRPC Procedures

### Admin Procedures (require admin role)

```typescript
// List investors for review
const { data } = await trpc.compliance.getPendingInvestors.useQuery({
  page: 1,
  limit: 12,
  search: "john",
  clearanceStatus: "pending",
});

// Get investor details
const { data } = await trpc.compliance.getInvestorDetails.useQuery({
  userId: "user_123",
});

// Set clearance status
await trpc.compliance.setClearance.mutate({
  userId: "user_123",
  status: "cleared", // "pending" | "cleared" | "cleared_with_conditions" | "rejected"
  conditions: ["Investment cap: $500,000"],
  notes: "Internal note",
});

// Grant vehicle access
await trpc.compliance.grantVehicleAccess.mutate({
  userId: "user_123",
  dealId: "deal_456",
  permissions: {
    canViewTeaser: true,
    canViewDocuments: true,
    canExpressInterest: true,
    canInvest: true,
  },
});

// Revoke vehicle access
await trpc.compliance.revokeVehicleAccess.mutate({
  userId: "user_123",
  dealId: "deal_456",
  reason: "Investment period closed",
});

// Get audit log
const { data } = await trpc.compliance.getAuditLog.useQuery({
  targetId: "user_123",
  page: 1,
  limit: 20,
});

// Get available deals
const { data } = await trpc.compliance.getAvailableDeals.useQuery();
```

### Investor Procedures (any authenticated user)

```typescript
// Get my clearance status
const { data } = await trpc.compliance.getMyClearance.useQuery();
// Returns: { clearance: { status, conditions, conditionsJson, clearedAt, investorVisibleNotes, expiresAt } | null }

// Get my vehicle permissions
const { data } = await trpc.compliance.getMyPermissions.useQuery();
// Returns: { permissions: [{ dealId, dealName, canViewTeaser, canViewDocuments, canExpressInterest, canInvest, grantedAt }] }
```

## Permission Checking (Server-Side)

```typescript
import {
  getUserAccessInfo,
  getUserClearance,
  hasVehicleAccess,
  getVehicleAccessLevel,
  canAccessRoute,
} from "@/lib/permissions";

// Complete access info
const access = await getUserAccessInfo(userId);
if (access.hasFullAccess) {
  // User is cleared with no conditions
}

// Just clearance status
const clearance = await getUserClearance(userId);
if (clearance?.status === "cleared") {
  // User is cleared
}

// Check specific deal access
if (await hasVehicleAccess(userId, dealId)) {
  // User can access this deal
}

// Get detailed permissions
const perms = await getVehicleAccessLevel(userId, dealId);
if (perms?.canViewDocuments) {
  // User can download documents
}

// Route protection
const { allowed, redirectTo } = await canAccessRoute(userId, pathname);
if (!allowed) {
  redirect(redirectTo);
}
```

## Audit Logging

```typescript
import {
  logAuditEvent,
  logClearanceChange,
  logPermissionGrant,
  logPermissionRevoke,
  logRoleGrant,
  logRoleRevoke,
} from "@/lib/audit";

// Generic audit event
await logAuditEvent({
  userId: performerId,
  action: "clearance_set",
  targetType: "clearance",
  targetId: targetUserId,
  previousValue: { status: "pending" },
  newValue: { status: "cleared" },
  metadata: { notes: "Approved after document review" },
});

// Convenience helpers
await logClearanceChange({
  performedBy: adminId,
  targetUserId: investorId,
  previousStatus: "pending",
  newStatus: "cleared",
  conditions: null,
  notes: "All documents verified",
});

await logPermissionGrant({
  performedBy: adminId,
  targetUserId: investorId,
  dealId: dealId,
  permissions: { canViewTeaser: true, canViewDocuments: true, canExpressInterest: true, canInvest: true },
});

await logPermissionRevoke({
  performedBy: adminId,
  targetUserId: investorId,
  dealId: dealId,
  reason: "Compliance issue",
});
```

## Clearance Status Card (Client Component)

```tsx
import { ClearanceStatusCard } from "@/app/(dashboard)/dashboard/components/clearance-status-card";

<ClearanceStatusCard
  status="cleared"                     // ClearanceStatus | null
  conditions={["Cap: $500k"]}          // string[] | null
  isOnboardingCompleted={true}         // boolean
/>
```

## Routes

| Route | Description |
|-------|-------------|
| `/admin/compliance` | Admin compliance dashboard |
| `/admin/compliance/investors/[id]` | Investor detail & review page |

## Clearance Statuses

| Status | Access Level |
|--------|--------------|
| `null` / `pending` | View deal names only |
| `cleared` | Full access |
| `cleared_with_conditions` | Limited access per conditions |
| `rejected` | No access |

## Common Conditions (Presets)

```typescript
const COMMON_CONDITIONS = [
  "Investment cap: $250,000 per deal",
  "Investment cap: $500,000 per deal",
  "Investment cap: $1,000,000 per deal",
  "Required: Enhanced due diligence for transactions over $100,000",
  "Required: Source of funds documentation for each investment",
  "Restricted: No access to offshore vehicle investments",
  "Restricted: Real estate deals only",
  "Required: Annual re-verification of accreditation status",
  "Required: Quarterly portfolio review call",
];
```

## Audit Actions

```typescript
type AuditAction =
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
  | "capital_notice_created"
  | "capital_notice_approved"
  | "capital_notice_sent"
  | "banking_change_requested"
  | "banking_change_verified"
  | "banking_change_rejected"
  | "login_success"
  | "login_failed"
  | "session_expired";
```

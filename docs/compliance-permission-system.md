# Compliance & Permission Promotion System

## Overview

The Permission Promotion System is a compliance-gated governance framework that controls investor access to deal documents and investment opportunities based on KYC clearance status. It provides granular, auditable control over what investors can see and do within the portal.

## Key Concepts

### Clearance Statuses

| Status | Description | Access Level |
|--------|-------------|--------------|
| `pending` | KYC submitted, awaiting compliance review | View deal names only |
| `cleared` | Fully approved, no restrictions | Full access to all deals and documents |
| `cleared_with_conditions` | Approved with restrictions | Access with specific conditions (e.g., investment caps) |
| `rejected` | Not approved | No access to deals or documents |

### Vehicle Permissions

Vehicle permissions provide deal-specific access control:

| Permission | Description |
|------------|-------------|
| `canViewTeaser` | Can view deal summary/teaser information |
| `canViewDocuments` | Can download deal documents (PPM, subscription docs) |
| `canExpressInterest` | Can submit interest in investing |
| `canInvest` | Can complete investment subscription |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  /admin/compliance                                          │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Investor List   │  │ Investor Detail │                  │
│  │ - Search/Filter │  │ - KYC Review    │                  │
│  │ - Status View   │  │ - Set Clearance │                  │
│  └────────┬────────┘  │ - Permissions   │                  │
│           │           │ - Audit Log     │                  │
│           │           └────────┬────────┘                  │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   tRPC Compliance Router                     │
│  apps/web/trpc/routers/compliance.ts                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Admin Procedures:                                     │   │
│  │ - getPendingInvestors    - setClearance              │   │
│  │ - getInvestorDetails     - grantVehicleAccess        │   │
│  │ - getAuditLog            - revokeVehicleAccess       │   │
│  │ - getAvailableDeals                                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Investor Procedures:                                  │   │
│  │ - getMyClearance         - getMyPermissions          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │investor_clearance│  │vehicle_permission│  │  audit_log  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
apps/web/
├── lib/
│   ├── audit.ts                    # Audit logging utilities
│   └── permissions.ts              # Permission checking utilities
├── trpc/routers/
│   └── compliance.ts               # Compliance tRPC router
└── app/(dashboard)/
    ├── (admin)/admin/compliance/
    │   ├── page.tsx                # Admin compliance dashboard
    │   ├── components/
    │   │   ├── compliance-dashboard-content.tsx
    │   │   └── compliance-table-client.tsx
    │   └── investors/[id]/
    │       ├── page.tsx            # Investor detail page
    │       └── components/
    │           ├── clearance-form.tsx
    │           ├── investor-kyc-details.tsx
    │           ├── vehicle-permissions.tsx
    │           └── audit-history.tsx
    └── dashboard/components/
        ├── clearance-status-card.tsx  # Investor-facing status display
        └── dashboard-main.tsx          # Main dashboard (uses clearance card)
```

## API Reference

### Admin Procedures

#### `compliance.getPendingInvestors`

Retrieves a paginated list of investors for compliance review.

**Input:**
```typescript
{
  page: number;          // Page number (default: 1)
  limit: number;         // Items per page (default: 12, max: 50)
  search?: string;       // Search by name or email
  clearanceStatus?: string; // Filter: "all" | "no_clearance" | "pending" | "cleared" | "cleared_with_conditions" | "rejected"
}
```

**Output:**
```typescript
{
  success: boolean;
  investors: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date | null;
    kycStatus: string | null;
    isOnboardingCompleted: boolean | null;
    clearance: {
      status: string;
      conditions: string | null;
      conditionsJson: string[] | null;
      clearedAt: Date | null;
      clearedBy: string | null;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}
```

---

#### `compliance.getInvestorDetails`

Retrieves complete investor information for compliance review.

**Input:**
```typescript
{
  userId: string;  // Investor's user ID
}
```

**Output:**
```typescript
{
  success: boolean;
  investor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date | null;
    kycStatus: string | null;
    isOnboardingCompleted: boolean | null;
    clearance: ClearanceRecord | null;
  };
  onboarding: {
    // Full onboarding record with all KYC fields
    beneficialOwners: BeneficialOwner[];
    authorizedSignatories: AuthorizedSignatory[];
    attestations: KycAttestation[];
    documents: OnboardingDocument[];
  } | null;
  clearanceHistory: ClearanceRecord[];
  permissions: VehiclePermission[];
  auditLog: AuditEntry[];
}
```

---

#### `compliance.setClearance`

Sets or updates an investor's clearance status.

**Input:**
```typescript
{
  userId: string;
  status: "pending" | "cleared" | "cleared_with_conditions" | "rejected";
  conditions?: string[];           // Required for "cleared_with_conditions"
  notes?: string;                  // Internal notes (not visible to investor)
  investorVisibleNotes?: string;   // Notes visible to investor
  expiresAt?: Date;               // Optional expiration date
}
```

**Behavior:**
- Creates a new clearance record (maintains history)
- When status is "cleared" or "cleared_with_conditions":
  - Auto-grants vehicle permissions to all live deals
  - "cleared" grants full permissions
  - "cleared_with_conditions" grants limited permissions (no document access, no invest)
- Logs the change to audit log

**Output:**
```typescript
{
  success: boolean;
  clearanceId: string;
  message: string;
}
```

---

#### `compliance.grantVehicleAccess`

Grants deal-specific permissions to an investor.

**Input:**
```typescript
{
  userId: string;
  dealId: string;
  permissions: {
    canViewTeaser: boolean;
    canViewDocuments: boolean;
    canExpressInterest: boolean;
    canInvest: boolean;
  };
  notes?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  permissionId: string;
  message: string;
}
```

---

#### `compliance.revokeVehicleAccess`

Revokes deal-specific permissions from an investor.

**Input:**
```typescript
{
  userId: string;
  dealId: string;
  reason?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### `compliance.getAuditLog`

Retrieves audit log entries.

**Input:**
```typescript
{
  userId?: string;    // Filter by performer
  targetId?: string;  // Filter by target
  action?: string;    // Filter by action type
  page: number;
  limit: number;
}
```

**Output:**
```typescript
{
  success: boolean;
  logs: Array<{
    id: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    previousValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    performedByName: string | null;
    createdAt: Date;
  }>;
  pagination: PaginationInfo;
}
```

---

#### `compliance.getAvailableDeals`

Returns all deals available for permission granting.

**Output:**
```typescript
Array<{
  id: string;
  name: string;
  status: string;
}>
```

---

### Investor Procedures

#### `compliance.getMyClearance`

Returns the current user's clearance status.

**Output:**
```typescript
{
  success: boolean;
  clearance: {
    status: string;
    conditions: string | null;
    conditionsJson: string[] | null;
    clearedAt: Date | null;
    investorVisibleNotes: string | null;
    expiresAt: Date | null;
  } | null;
}
```

---

#### `compliance.getMyPermissions`

Returns the current user's vehicle permissions.

**Output:**
```typescript
{
  success: boolean;
  permissions: Array<{
    dealId: string;
    dealName: string;
    canViewTeaser: boolean;
    canViewDocuments: boolean;
    canExpressInterest: boolean;
    canInvest: boolean;
    grantedAt: Date;
  }>;
}
```

## Audit Logging

### Audit Actions

The system logs the following actions:

| Action | Target Type | Description |
|--------|-------------|-------------|
| `clearance_set` | `clearance` | Clearance status changed |
| `permission_granted` | `permission` | Vehicle permission granted |
| `permission_revoked` | `permission` | Vehicle permission revoked |
| `role_granted` | `user` | User role assigned |
| `role_revoked` | `user` | User role removed |
| `document_uploaded` | `document` | Document uploaded |
| `document_published` | `document` | Document published |
| `user_created` | `user` | User account created |
| `user_updated` | `user` | User account modified |

### Audit Log Structure

```typescript
{
  id: string;
  userId: string | null;      // Who performed the action
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;           // ID of affected entity
  previousValue: object | null;
  newValue: object | null;
  metadata: object | null;    // Additional context (notes, etc.)
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
```

### Using Audit Helpers

```typescript
import { logClearanceChange, logPermissionGrant, logPermissionRevoke } from "@/lib/audit";

// Log clearance change
await logClearanceChange({
  performedBy: adminUserId,
  targetUserId: investorId,
  previousStatus: "pending",
  newStatus: "cleared",
  conditions: null,
  notes: "All documents verified",
});

// Log permission grant
await logPermissionGrant({
  performedBy: adminUserId,
  targetUserId: investorId,
  dealId: dealId,
  permissions: {
    canViewTeaser: true,
    canViewDocuments: true,
    canExpressInterest: true,
    canInvest: true,
  },
  notes: "Full access granted",
});

// Log permission revoke
await logPermissionRevoke({
  performedBy: adminUserId,
  targetUserId: investorId,
  dealId: dealId,
  reason: "Investment period closed",
});
```

## Permission Checking

### Server-Side Permission Checks

```typescript
import { getUserAccessInfo, hasVehicleAccess, getVehicleAccessLevel } from "@/lib/permissions";

// Get complete access info for a user
const accessInfo = await getUserAccessInfo(userId);
// Returns: { isAuthenticated, isAdmin, isOnboardingCompleted, clearance, hasFullAccess, canViewDealDocuments, canAccessDealMarketplace }

// Check if user can access a specific deal
const canAccess = await hasVehicleAccess(userId, dealId);
// Returns: boolean

// Get detailed permissions for a deal
const permissions = await getVehicleAccessLevel(userId, dealId);
// Returns: { canViewTeaser, canViewDocuments, canExpressInterest, canInvest } | null
```

### Route Protection

```typescript
import { canAccessRoute } from "@/lib/permissions";

const result = await canAccessRoute(userId, "/deals/abc123/documents");
// Returns: { allowed: boolean, reason?: string, redirectTo?: string }
```

## Admin UI Guide

### Compliance Dashboard (`/admin/compliance`)

The main compliance dashboard provides:

1. **Search & Filter**
   - Search by investor name or email
   - Filter by clearance status

2. **Investor Table**
   - Name and avatar
   - Email address
   - Onboarding status (Completed/Pending)
   - Clearance status badge
   - Join date
   - "Review" action button

3. **Pagination**
   - Navigate through pages of investors

### Investor Detail Page (`/admin/compliance/investors/[id]`)

Four tabs for comprehensive review:

#### KYC Information Tab
- Personal/Entity information
- Contact details
- Address
- Accreditation status
- Source of funds/wealth
- Investment profile
- PEP status and declarations
- Beneficial owners (for entities)
- Authorized signatories (for entities)
- KYC attestations
- Uploaded documents

#### Clearance Tab
- Current clearance status
- Set new status: Pending, Cleared, Cleared with Conditions, Rejected
- Add conditions (common presets or custom)
- Internal notes (not shown to investor)

#### Permissions Tab
- View current vehicle permissions
- Grant access to new deals
- Configure specific permissions per deal
- Revoke access with reason

#### Audit History Tab
- Timeline of all compliance-related events
- Shows who performed actions and when
- Details of status changes and conditions

## Investor Dashboard Integration

### ClearanceStatusCard Component

The `ClearanceStatusCard` displays the investor's clearance status on their dashboard:

```tsx
import { ClearanceStatusCard } from "./clearance-status-card";

<ClearanceStatusCard
  status={clearanceStatus}           // "pending" | "cleared" | "cleared_with_conditions" | "rejected" | null
  conditions={clearanceConditions}   // string[] | null
  isOnboardingCompleted={true}
/>
```

**Display States:**

1. **Onboarding Not Completed**: Prompts to complete onboarding
2. **Pending**: Shows review in progress message
3. **Cleared**: Shows full access confirmation with list of available features
4. **Cleared with Conditions**: Shows access with conditions listed
5. **Rejected**: Shows rejection message with support contact

## Database Schema

### investor_clearance Table

```sql
CREATE TABLE investor_clearance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  status clearance_status_enum NOT NULL,
  conditions TEXT,                    -- Semicolon-separated conditions
  conditions_json JSONB,              -- Array of conditions
  cleared_by TEXT REFERENCES "user"(id),
  cleared_at TIMESTAMP,
  notes TEXT,                         -- Internal notes
  investor_visible_notes TEXT,        -- Shown to investor
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### vehicle_permission Table

```sql
CREATE TABLE vehicle_permission (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  deal_id TEXT NOT NULL REFERENCES deal(id),
  can_view_teaser BOOLEAN DEFAULT true,
  can_view_documents BOOLEAN DEFAULT false,
  can_express_interest BOOLEAN DEFAULT false,
  can_invest BOOLEAN DEFAULT false,
  granted_by TEXT REFERENCES "user"(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_by TEXT REFERENCES "user"(id),
  revoke_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### audit_log Table

```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  action audit_action_enum NOT NULL,
  target_type audit_target_type_enum NOT NULL,
  target_id TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Common Workflows

### Clearing an Investor

1. Admin navigates to `/admin/compliance`
2. Searches for investor by name/email
3. Clicks "Review" to open detail page
4. Reviews KYC information in "KYC Information" tab
5. Goes to "Clearance" tab
6. Selects "Cleared" or "Cleared with Conditions"
7. Adds conditions if applicable
8. Adds internal notes
9. Clicks "Update Clearance"
10. System auto-grants vehicle permissions to live deals
11. Action is logged to audit trail

### Granting Additional Deal Access

1. Admin navigates to investor detail page
2. Goes to "Permissions" tab
3. Clicks "Grant Access"
4. Selects deal from dropdown
5. Configures specific permissions
6. Clicks "Grant Access"
7. Action is logged to audit trail

### Revoking Access

1. Admin navigates to investor detail page
2. Goes to "Permissions" tab
3. Clicks trash icon next to permission
4. Confirms revocation
5. Optionally provides reason
6. Action is logged to audit trail

## Security Considerations

1. **Admin-Only Access**: All compliance procedures verify admin role
2. **Audit Trail**: Every permission change is logged with performer, timestamp, and details
3. **No Deletion**: Clearance records are never deleted, maintaining full history
4. **Revocation Tracking**: Permission revocations preserve the original grant and add revocation metadata
5. **Input Validation**: All inputs are validated using Zod schemas

## Error Handling

The compliance router throws TRPCError with appropriate codes:

| Code | Scenario |
|------|----------|
| `UNAUTHORIZED` | Non-admin trying to access admin procedures |
| `NOT_FOUND` | Investor or permission not found |
| `CONFLICT` | Attempting to grant duplicate permission |

## Testing

### Manual Testing Checklist

- [ ] Create new investor, verify shows as "No Clearance"
- [ ] Set clearance to "Pending", verify badge updates
- [ ] Set clearance to "Cleared", verify auto-permission grant
- [ ] Set clearance to "Cleared with Conditions", add conditions
- [ ] Grant additional deal access
- [ ] Revoke deal access
- [ ] Verify audit log captures all actions
- [ ] Verify investor sees correct status on dashboard
- [ ] Verify conditions display correctly to investor

# Deal Marketplace Access Control System

## Overview

The Deal Marketplace uses a **unified vehiclePermission-based access control system**. This system ensures that:

1. Only compliance-cleared investors can see deals
2. **Clearance requires completed KYC/onboarding** - investors must complete their onboarding before clearance can be granted
3. Each investor's access to specific deals is explicitly controlled
4. Granular permissions determine what actions an investor can take on each deal
5. All access changes are audited

## KYC Requirement

**IMPORTANT:** Clearance (`cleared` or `cleared_with_conditions`) can ONLY be granted to investors who have completed their onboarding/KYC submission.

| Onboarding Status | Allowed Clearance Statuses |
|-------------------|---------------------------|
| `isOnboardingCompleted: false` | `pending`, `rejected` only |
| `isOnboardingCompleted: true` | `pending`, `cleared`, `cleared_with_conditions`, `rejected` |

This ensures that:
- Investors cannot access any deal materials until they complete KYC
- Compliance officers can only approve investors who have submitted required documentation
- The system prevents accidental access grants to incomplete profiles

## Architecture

```
                         ┌─────────────────────────────────────┐
                         │         ACCESS CONTROL FLOW         │
                         └─────────────────────────────────────┘

                              ┌─────────────────────┐
                              │ isOnboardingCompleted│
                              │   (KYC Prerequisite) │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼─────┐       ┌──────▼──────┐
              │   false   │       │    true     │
              │ (pending/ │       │  (can be    │
              │ rejected  │       │  cleared)   │
              │  only)    │       └──────┬──────┘
              └───────────┘              │
                                         │
                              ┌──────────▼──────────┐
                              │   investorClearance │
                              │   (Global Gate)     │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼─────┐       ┌──────▼──────┐      ┌──────▼──────┐
              │  pending  │       │   cleared   │      │  rejected   │
              │  (block)  │       │   (allow)   │      │  (block)    │
              └───────────┘       └──────┬──────┘      └─────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  vehiclePermission  │
                              │  (Per-Deal Access)  │
                              └──────────┬──────────┘
                                         │
              ┌────────────────┬─────────┼─────────┬────────────────┐
              │                │         │         │                │
        ┌─────▼─────┐   ┌──────▼───┐  ┌──▼──┐  ┌───▼────┐   ┌───────▼───────┐
        │canViewTeaser│   │canViewDocs│  │canExpress│  │canInvest│   │  (not set)   │
        │  = true   │   │  = true  │  │Interest │  │ = true │   │  = no access │
        └───────────┘   └──────────┘  └─────────┘  └────────┘   └───────────────┘
```

## Access Matrix

| Clearance Status | vehiclePermission | Marketplace Visibility | Deal Actions |
|------------------|-------------------|------------------------|--------------|
| `pending` | Any | No deals visible | None |
| `rejected` | Any | No deals visible | None |
| `cleared` | None for deal | Deal NOT visible | None |
| `cleared` | `canViewTeaser: true` | Deal visible | Based on permission flags |
| `cleared_with_conditions` | `canViewTeaser: true` | Deal visible | Based on permission flags |
| Admin | N/A | All deals visible | Full access |

## Permission Flags

Each `vehiclePermission` record has 4 boolean flags:

| Flag | Controls | Default |
|------|----------|---------|
| `canViewTeaser` | Deal appears in marketplace, can view deal card/summary | `true` |
| `canViewDocuments` | Can download PPM, subscription docs, data room files | `false` |
| `canExpressInterest` | Can click "I'm Interested", add to watchlist | `false` |
| `canInvest` | Can submit investment commitment, sign subscription | `false` |

### Permission Combinations

**Full Access (typical for "cleared" investors):**
```typescript
{
  canViewTeaser: true,
  canViewDocuments: true,
  canExpressInterest: true,
  canInvest: true,
}
```

**View Only (typical for "cleared_with_conditions" or restricted):**
```typescript
{
  canViewTeaser: true,
  canViewDocuments: false,
  canExpressInterest: true,
  canInvest: false,
}
```

**Teaser Only (limited preview):**
```typescript
{
  canViewTeaser: true,
  canViewDocuments: false,
  canExpressInterest: false,
  canInvest: false,
}
```

## How Permissions Are Granted

### 1. Auto-Grant on Clearance

When an admin sets an investor's clearance to `cleared` or `cleared_with_conditions`, the system automatically grants `vehiclePermission` for all non-draft deals:

```typescript
// In compliance.setClearance mutation
if (status === "cleared" || status === "cleared_with_conditions") {
  // Get all non-draft deals
  const deals = await db.select().from(deal).where(ne(deal.status, "draft"));

  for (const deal of deals) {
    // Grant permission with flags based on clearance and deal status
    await db.insert(vehiclePermission).values({
      userId: investorId,
      dealId: deal.id,
      canViewTeaser: true,
      canViewDocuments: status === "cleared",
      canExpressInterest: true,
      canInvest: status === "cleared" && (deal.status === "live" || deal.status === "closing"),
    });
  }
}
```

### 2. Bulk Grant for New Deals

When publishing a new deal, admin can grant access to all cleared investors:

```typescript
await trpc.compliance.grantDealToAllClearedInvestors.mutate({
  dealId: "deal_123",
  permissions: {
    canViewTeaser: true,
    canViewDocuments: true,
    canExpressInterest: true,
    canInvest: true,
  },
});
```

### 3. Manual Grant

Admin can manually grant access to specific investors:

```typescript
await trpc.compliance.grantVehicleAccess.mutate({
  userId: "user_123",
  dealId: "deal_456",
  permissions: {
    canViewTeaser: true,
    canViewDocuments: true,
    canExpressInterest: true,
    canInvest: true,
  },
  notes: "Special access for strategic partner",
});
```

### 4. Revocation

Admin can revoke access at any time:

```typescript
await trpc.compliance.revokeVehicleAccess.mutate({
  userId: "user_123",
  dealId: "deal_456",
  reason: "Investment period closed",
});
```

## Code Implementation

### Marketplace Query

The marketplace uses `vehiclePermission` to determine which deals to show:

```typescript
// apps/web/app/(dashboard)/deals/lib/get-marketplace-deals-cached.ts

// 1. Check clearance status
const clearance = await db.select().from(investorClearance)
  .where(eq(investorClearance.userId, userId))
  .orderBy(desc(investorClearance.createdAt))
  .limit(1);

// 2. If not cleared, return empty result
if (!clearance || clearance.status === "pending" || clearance.status === "rejected") {
  return { deals: [] };
}

// 3. Get permitted deal IDs
const permissions = await db.select()
  .from(vehiclePermission)
  .where(
    and(
      eq(vehiclePermission.userId, userId),
      eq(vehiclePermission.canViewTeaser, true),
      isNull(vehiclePermission.revokedAt)
    )
  );

// 4. Filter deals to only those with permission
const deals = await db.select()
  .from(deal)
  .where(inArray(deal.id, permittedDealIds));
```

### Deal Detail Page

The deal detail page checks `vehiclePermission` before allowing access:

```typescript
// apps/web/trpc/routers/deals.ts - getDealForView

// 1. Check clearance
const clearance = await db.select().from(investorClearance)...

if (!isCleared) {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// 2. Check vehiclePermission
const permission = await db.select()
  .from(vehiclePermission)
  .where(
    and(
      eq(vehiclePermission.userId, userId),
      eq(vehiclePermission.dealId, dealId),
      isNull(vehiclePermission.revokedAt)
    )
  );

if (!permission || !permission.canViewTeaser) {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// 3. Return deal with permissions for UI
return {
  deal: dealRecord,
  permissions: {
    canViewTeaser: permission.canViewTeaser,
    canViewDocuments: permission.canViewDocuments,
    canExpressInterest: permission.canExpressInterest,
    canInvest: permission.canInvest,
  },
};
```

### UI Permission Enforcement

Components use permission flags to show/hide actions:

```tsx
// apps/web/app/(dashboard)/deals/[dealId]/components/deal-actions.tsx

function DealActions({ permissions }) {
  if (!permissions.canExpressInterest) {
    return <RestrictedAccessMessage />;
  }

  return (
    <div>
      {/* Interest buttons always shown if canExpressInterest */}
      <Button onClick={handleExpressInterest}>I'm Interested</Button>

      {/* Invest button only if canInvest */}
      {permissions.canInvest && (
        <Button onClick={handleInvest}>Invest Now</Button>
      )}

      {/* Show notice if limited */}
      {!permissions.canInvest && (
        <Notice>Investment requires additional clearance</Notice>
      )}
    </div>
  );
}
```

## Helper Functions

### lib/permissions.ts

```typescript
// Get all deals a user can see
const dealIds = await getVisibleDealIds(userId);

// Check if user can see a specific deal
const canView = await canViewDeal(userId, dealId);

// Get complete permissions for a deal
const permissions = await getDealPermissions(userId, dealId);
// Returns: { canViewTeaser, canViewDocuments, canExpressInterest, canInvest, clearanceStatus, hasPermission }

// Check if user is admin (bypasses all checks)
const isAdmin = await isUserAdmin(userId);
```

## API Reference

### Admin Procedures

| Procedure | Description |
|-----------|-------------|
| `compliance.setClearance` | Set clearance status (auto-grants permissions) |
| `compliance.grantVehicleAccess` | Grant access to a specific deal |
| `compliance.revokeVehicleAccess` | Revoke access to a specific deal |
| `compliance.grantDealToAllClearedInvestors` | Bulk grant for new deals |
| `compliance.getInvestorDetails` | Get investor's permissions and clearance |

### Investor Procedures

| Procedure | Description |
|-----------|-------------|
| `compliance.getMyClearance` | Get my clearance status |
| `compliance.getMyPermissions` | Get my deal permissions |
| `deals.getDealForView` | Get deal with my permissions |

## Audit Trail

All permission changes are logged to `audit_log`:

- `permission_granted` - When access is granted (manual or auto)
- `permission_revoked` - When access is revoked
- `clearance_set` - When clearance status changes (triggers auto-grant)

## Migration from Old System

The old system used `dealInvite` for visibility and `deal.visibility` for access control. The new system:

1. **Replaces `dealInvite`** with `vehiclePermission` for controlling deal visibility
2. **Ignores `deal.visibility`** field (can be deprecated)
3. **Uses `investorClearance`** as the global gate before checking per-deal permissions

### Deprecation Notes

- `dealInvite` table: No longer used for marketplace visibility
- `deal.visibility` field: No longer used for access control
- `user.kycStatus`: Still used for legacy purposes but superseded by `investorClearance`

## Common Workflows

### New Investor Onboards

```
1. Investor registers and starts onboarding
2. Investor submits KYC documents and completes onboarding (isOnboardingCompleted = true)
3. Admin reviews in /admin/compliance (clearance options now available)
4. Admin sets clearance to "cleared" (only possible after step 2)
5. System auto-grants vehiclePermission for all non-draft deals
6. Investor can now see deals in marketplace
```

**Note:** If onboarding is not complete, admin can only set status to "pending" or "rejected". The UI will show a warning and disable the "cleared" options.

### New Deal Published

```
1. Admin creates deal (status: draft)
2. Admin sets deal status to "live"
3. Admin runs grantDealToAllClearedInvestors
4. All cleared investors can now see the deal
```

### Investor Needs Special Access

```
1. Admin navigates to investor detail page
2. Admin goes to "Permissions" tab
3. Admin clicks "Grant Access"
4. Admin selects deal and configures permissions
5. Investor now has access to that deal
```

### Investor Access Revoked

```
1. Admin navigates to investor detail page
2. Admin goes to "Permissions" tab
3. Admin clicks revoke on the deal permission
4. Deal disappears from investor's marketplace
```

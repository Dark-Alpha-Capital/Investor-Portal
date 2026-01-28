# Investment Flow - Who Calls What API

## Complete Investment Lifecycle

### Stage 1: Interest Expression ✅

**Who:** **USER** (Investor)
**API:** `POST /api/deals/[dealId]/interest`
**When:** User clicks "I'm Interested" or "Soft Commit" on deal page
**What Happens:**

- Creates record in `dealInterest` table
- Status: `"interested"`, `"soft_committed"`, `"meeting_requested"`, or `"pass"`
- This is **non-binding** preliminary interest

---

### Stage 2: Commitment (Signing Documents) 🔒

**Who:** **ADMIN ONLY**
**API:** `POST /api/investments`
**When:** After user signs commitment documents offline (legal process)
**What Happens:**

- Admin creates investment record in `investment` table
- Status: `"committed"` (signed docs, money not wired yet)
- `committedAmount`: Amount user signed for
- `fundedAmount`: `0` (not wired yet)
- `committedDate`: Date documents were signed

**API Body:**

```json
{
  "dealId": "deal-123",
  "userId": "user-456", // Admin can specify any user
  "committedAmount": 100000,
  "committedDate": "2024-01-15",
  "ownershipPercentage": 2.5 // optional
}
```

**Why Admin Only:**

- Investment records are legal commitments
- Must be verified after documents are signed
- Admin ensures accuracy and compliance

---

### Stage 3: Funding (Wiring Money) 🔒

**Who:** **ADMIN ONLY**
**API:** `PATCH /api/investments/[investmentId]`
**When:** After admin confirms wire transfer has been received
**What Happens:**

- Updates `fundedAmount` with wired amount
- Status automatically changes: `"committed"` → `"active"` (if fundedAmount > 0)
- Investment is now active and deployed

**API Body:**

```json
{
  "fundedAmount": 100000
}
```

**Why Admin Only:**

- Wire transfers must be verified by admin
- Prevents users from falsely claiming they wired money
- Admin confirms receipt before updating system

---

### Stage 4: Performance Updates 🔒

**Who:** **ADMIN ONLY**
**API:** `PATCH /api/investments/[investmentId]`
**When:** Periodically (quarterly, monthly, etc.)
**What Happens:**

- Updates `currentValue` (NAV - Net Asset Value)
- Updates `distributions` (cash returned to investors)
- Updates `status` if deal exits

**API Body Examples:**

**Update NAV:**

```json
{
  "currentValue": 110000
}
```

**Record Distribution:**

```json
{
  "distributions": 5000
}
```

**Mark as Liquidated:**

```json
{
  "status": "liquidated"
}
```

**Why Admin Only:**

- NAV calculations require admin verification
- Distributions must be confirmed
- Status changes are admin-controlled

---

### Stage 5: Viewing Portfolio 👤

**Who:** **USER** (Investor)
**API:** `GET /api/investments/portfolio`
**When:** User views dashboard
**What Happens:**

- Returns portfolio metrics (Capital Committed, Deployed, Current Value)
- Returns list of user's investments
- User can only see their own investments

---

### Stage 6: Viewing Documents 👤

**Who:** **USER** (Investor)
**API:** `GET /api/investments/documents`
**When:** User clicks "Documents" on dashboard
**What Happens:**

- Returns investment documents (K-1s, Quarterly Reports, etc.)
- Filterable by deal and document type
- User can only see documents for their investments

---

## Summary Table

| Stage              | Who Calls API | API Endpoint                        | Purpose                      |
| ------------------ | ------------- | ----------------------------------- | ---------------------------- |
| **Interest**       | User          | `POST /api/deals/[dealId]/interest` | Express preliminary interest |
| **Commitment**     | **Admin**     | `POST /api/investments`             | Record signed commitment     |
| **Funding**        | **Admin**     | `PATCH /api/investments/[id]`       | Record wire transfer         |
| **Performance**    | **Admin**     | `PATCH /api/investments/[id]`       | Update NAV, distributions    |
| **View Portfolio** | User          | `GET /api/investments/portfolio`    | View own investments         |
| **View Documents** | User          | `GET /api/investments/documents`    | View investment docs         |

---

## Typical Workflow Example

1. **User** browses deals → clicks "I'm Interested"
   - `dealInterest` record created ✅

2. **Admin** reviews interest → sends commitment documents to user

3. **User** signs documents offline (legal process)

4. **Admin** creates investment record:
   - `POST /api/investments` with `status: "committed"` ✅

5. **User** wires money to deal account

6. **Admin** confirms wire transfer → updates investment:
   - `PATCH /api/investments/[id]` with `fundedAmount: 100000`
   - Status auto-changes to `"active"` ✅

7. **Admin** periodically updates performance:
   - `PATCH /api/investments/[id]` with `currentValue: 110000` ✅

8. **User** views portfolio on dashboard:
   - Sees Capital Committed, Deployed, Current Value ✅

9. **Admin** uploads K-1 tax form → links to investment

10. **User** views documents page → downloads K-1 ✅

---

## Key Points

✅ **Users** can express interest and view their portfolio/documents
🔒 **Admins** create and manage investment records (commitment, funding, performance)
📋 **Investment records** are legal commitments - must be admin-verified
💰 **Wire transfers** must be confirmed by admin before updating system
📊 **Performance metrics** are admin-managed and periodically updated

# DarkAlpha Capital Investor Portal - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Goals & Objectives](#goals--objectives)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [User Types & Roles](#user-types--roles)
6. [User Flows](#user-flows)
7. [Data Model & Schema](#data-model--schema)
8. [File Storage with Nextcloud](#file-storage-with-nextcloud)
9. [Background Job Processing with BullMQ](#background-job-processing-with-bullmq)
10. [Email System](#email-system)
11. [API Layer (tRPC)](#api-layer-trpc)
12. [Current Features](#current-features)

---

## Project Overview

The **DarkAlpha Capital Investor Portal** is a private equity/venture capital platform designed to facilitate the complete lifecycle of investor relationships. The platform handles:

- **Investor Onboarding**: Multi-step KYC (Know Your Customer) workflow with document collection
- **Deal Marketplace**: Curated investment opportunities with visibility controls
- **Portfolio Management**: Tracking of investments, distributions, and returns
- **Admin Dashboard**: Complete oversight of investors, deals, and KYC reviews

The platform is built with a focus on **security** (handling sensitive financial and identity documents), **scalability** (async job processing), and **compliance** (role-based access control and document tracking).

---

## Goals & Objectives

### Primary Goals

1. **Streamlined Investor Onboarding**
   - Collect comprehensive investor questionnaires covering investment mandate, preferences, and compliance requirements
   - Securely collect and store KYC documents (identification, W-9/W-8BEN, accreditation proof)
   - Automated email notifications for both investors and admins upon submission
   - Track onboarding status through the complete review cycle

2. **Deal Marketplace**
   - Create and manage investment opportunities with various visibility levels
   - Support for deal curation - invite specific investors to specific deals
   - Track investor interest levels and soft commitments
   - Manage deal lifecycle from draft to funded/exited

3. **Portfolio Tracking**
   - Track investor positions across multiple deals
   - Monitor committed vs. funded amounts
   - Calculate current NAV and distributions
   - Store and organize investment documents (K-1s, quarterly reports)

4. **Administrative Control**
   - Complete oversight of all registered investors
   - KYC review and approval workflow
   - Deal management and investor curation
   - User management (banning, role assignment)

### Business Context

DarkAlpha Capital operates as an independent sponsor in private equity. The platform serves to:
- Qualify and onboard accredited investors
- Present curated deal flow to appropriate investors
- Manage the capital commitment process
- Provide transparency through portfolio tracking

---

## Technology Stack

### Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.2.22 | JavaScript runtime and package manager |
| **Next.js** | 16.1 | React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Turborepo** | 2.6 | Monorepo build system |

### Backend & API

| Technology | Purpose |
|------------|---------|
| **tRPC** | Type-safe API layer between client and server |
| **Hono** | Lightweight HTTP server for file handling |
| **BullMQ** | Redis-based job queue for background processing |
| **Better Auth** | Authentication with OAuth and email/password |

### Database & Storage

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |
| **Drizzle ORM** | Type-safe database queries and migrations |
| **Redis** | Job queue persistence (BullMQ) |
| **Nextcloud (WebDAV)** | Self-hosted file storage for sensitive documents |
| **Google Cloud Storage** | Secondary file storage option |

### Email & Communication

| Technology | Purpose |
|------------|---------|
| **Resend** | Transactional email delivery |
| **React Email** | Email template components |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible components |
| **Radix UI** | Headless UI primitives |
| **Lucide React** | Icon library |

### CMS

| Technology | Purpose |
|------------|---------|
| **Prismic** | Headless CMS for marketing content |

---

## Architecture Overview

### Monorepo Structure

```
investor-portal/
├── apps/
│   ├── web/              # Next.js frontend application
│   ├── server/           # Hono API server
│   └── worker/           # BullMQ background job processor
├── packages/
│   ├── db/               # Drizzle ORM schema and queries
│   ├── mail/             # Email templates and sending logic
│   ├── ui/               # Shared UI components
│   ├── typescript-config/# Shared TS configs
│   └── eslint-config/    # Shared ESLint configs
```

### Application Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPS/WEB (Next.js)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │   App Router    │  │  tRPC Routers   │  │   Better Auth       │ │
│  │   (Pages/API)   │  │  (API Logic)    │  │   (Auth Routes)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│            │                   │                      │             │
│            └───────────────────┼──────────────────────┘             │
│                                ▼                                    │
│                      PostgreSQL (via Drizzle)                       │
│                                │                                    │
│                                ▼                                    │
│                      Redis (Job Queues)                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌────────────────────────────┐   ┌────────────────────────────────────┐
│    APPS/SERVER (Hono)      │   │       APPS/WORKER (BullMQ)         │
│  • File upload handling    │   │  • Onboarding file uploads         │
│  • Heavy processing        │   │  • Email sending                   │
│  • Health checks           │   │  • Deal folder management          │
└────────────────────────────┘   │  • Report generation               │
                                 └────────────────────────────────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    ▼                           ▼
                         ┌──────────────────┐        ┌──────────────────┐
                         │    Nextcloud     │        │      Resend      │
                         │  (WebDAV Files)  │        │   (Email API)    │
                         └──────────────────┘        └──────────────────┘
```

### Package Imports

```typescript
// Database package
import { db } from "@repo/db";                    // Drizzle client
import { user, deal, ... } from "@repo/db/schema"; // Schema tables
import { getUserById } from "@repo/db/queries";   // Shared queries

// Mail package
import { sendEmailDirect, createResendClient } from "@repo/mail";
import { OnboardingInvestorConfirmation } from "@repo/mail/emails";
import { EMAIL_CONFIG, type EmailJobData } from "@repo/mail/types";
```

---

## User Types & Roles

### Role Determination

Roles are automatically assigned based on email domain during registration:

```typescript
function getUserRoleFromEmail(email: string): string {
  if (email.toLowerCase().endsWith("@darkalphacapital.com")) {
    return "admin";
  }
  return "user";
}
```

### 1. Investor (Role: `user`)

**Who They Are:**
- External investors seeking to participate in DarkAlpha Capital's deals
- Individuals or entities (family offices, institutions, etc.)

**Capabilities:**
- Complete onboarding questionnaire and KYC document upload
- View personalized dashboard based on KYC status
- Browse available deals (based on visibility/invitation)
- Express interest in deals and soft-commit capital
- View portfolio holdings and investment documents
- Download K-1s, quarterly reports, and other documents

**Restrictions:**
- Cannot access admin dashboard
- Cannot create or manage deals
- Cannot review other users' KYC submissions
- Access depends on KYC approval status

### 2. Administrator (Role: `admin`)

**Who They Are:**
- DarkAlpha Capital team members (`@darkalphacapital.com` email)

**Capabilities:**
- Full access to admin dashboard
- View and manage all registered investors
- Review KYC submissions and change status (approve/reject/pending docs)
- Create, edit, and delete deals
- Curate deals for specific investors (invitations)
- View all investors, admins, and deals
- Ban/unban users

**Restrictions:**
- Cannot complete investor onboarding (blocked by UI)
- Onboarding flow shows "Admin Access Restricted" message

### KYC Status States

Investors progress through these KYC statuses after onboarding:

| Status | Description | User Experience |
|--------|-------------|-----------------|
| `review` | Submission under review | Waiting screen, no dashboard access |
| `pending_docs` | Additional documents needed | Document upload prompt |
| `approved` | KYC approved | Full dashboard and deal access |
| `rejected` | KYC rejected | Rejection notice with contact info |

---

## User Flows

### Flow 1: New Investor Registration & Onboarding

```
┌──────────────────┐
│   1. Sign Up     │  • Email/password OR Google OAuth
│   /register      │  • Email verification required
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Email Verify  │  • Click verification link
│                  │  • Account activated
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   3. Login       │  • Redirected to /dashboard
│   /login         │  • System checks onboarding status
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. Onboarding   │  isOnboardingCompleted = false
│  Redirect        │  → Redirect to /onboarding
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│           5. ONBOARDING FLOW (/onboarding)           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  STEP 1: Investor Details                            │
│  • Organization name, primary contact                │
│  • Capital provider type, investor type              │
│  • Geographic focus                                  │
│                                                      │
│  STEP 2: Accreditation & Status                      │
│  • Accreditation status and method                   │
│  • Entity tax ID (EIN)                               │
│  • Authorized signatory information                  │
│                                                      │
│  STEP 3: Investment Preferences                      │
│  • Independent sponsor fit                           │
│  • NDA preferences                                   │
│  • Process timing expectations                       │
│  • Economics and governance                          │
│  • Support letter preferences                        │
│  • Communication preferences                         │
│                                                      │
│  STEP 4: Investment Mandate                          │
│  • Equity check size                                 │
│  • Enterprise value / EBITDA ranges                  │
│  • Ownership preferences                             │
│  • Transaction types                                 │
│  • Revenue characteristics                           │
│  • Sectors of interest / to avoid                    │
│                                                      │
│  STEP 5: KYC Document Upload                         │
│  • Government-issued ID                              │
│  • W-9 or W-8BEN                                     │
│  • Accreditation documentation                       │
│  • Files sent to BullMQ → Nextcloud                  │
│                                                      │
│  STEP 6: Legal & E-Signature                         │
│  • Legal documents acknowledgment                    │
│  • Electronic signature capture                      │
│                                                      │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              6. SUBMISSION PROCESSING                 │
├──────────────────────────────────────────────────────┤
│  • Onboarding data saved to PostgreSQL               │
│  • user.isOnboardingCompleted = true                 │
│  • user.kycStatus = "review"                         │
│  • File upload job queued to onboarding-queue        │
│  • Investor confirmation email queued                │
│  • Admin notification email queued                   │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│           7. KYC REVIEW WAITING SCREEN               │
│                                                      │
│  User sees: "Your application is under review"       │
│  Admin reviews in /admin dashboard                   │
└────────────────────┬─────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Approved │ │ Pending  │ │ Rejected │
   │          │ │  Docs    │ │          │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
        ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Full     │ │ Document │ │ Contact  │
   │ Dashboard│ │ Upload   │ │ Support  │
   │ Access   │ │ Request  │ │ Notice   │
   └──────────┘ └──────────┘ └──────────┘
```

### Flow 2: Admin Deal Management

```
┌──────────────────┐
│  Admin Login     │  @darkalphacapital.com email
│                  │  Auto-assigned admin role
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Admin Dashboard │  /admin
│                  │
└────────┬─────────┘
         │
    ┌────┴────┬───────────┬───────────┐
    ▼         ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Investors│ │ Admins │ │ Deals  │ │  KYC   │
│  Tab   │ │  Tab   │ │  Tab   │ │ Review │
└────────┘ └────────┘ └───┬────┘ └────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   CREATE NEW DEAL     │
              ├───────────────────────┤
              │ • Name, description   │
              │ • Sector, geography   │
              │ • Target raise        │
              │ • Min investment      │
              │ • Target IRR/MOIC     │
              │ • Status (draft/live) │
              │ • Visibility level    │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  DEAL QUEUE JOB       │
              │  Creates Nextcloud    │
              │  folder: /Deals/slug  │
              └───────────────────────┘
```

### Flow 3: Investor Deal Interest

```
┌──────────────────┐
│ Approved Investor│  kycStatus = "approved"
│    Dashboard     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Deal Marketplace│  /deals
│                  │  Shows deals based on:
│                  │  • visibility = "public"
│                  │  • visibility = "accredited" (if accredited)
│                  │  • deal_invite exists (invite_only)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Deal Detail    │  /deals/[slug]
│                  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Express Interest │  Creates deal_interest record
│                  │  status: "interested"
│                  │  Optionally: proposed_amount
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Soft Commit     │  status: "soft_committed"
│  (Optional)      │  proposed_amount confirmed
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Investment      │  Admin creates investment record
│  Created         │  status: "committed" → "active"
└──────────────────┘
```

---

## Data Model & Schema

### Core Entities

#### User & Authentication

```typescript
// User table - core identity
user {
  id: string (PK)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string?
  role: string  // "user" | "admin"
  isOnboardingCompleted: boolean
  kycStatus: enum("review", "approved", "pending_docs", "rejected")
  banned: boolean
  banReason: string?
  banExpires: timestamp?
  createdAt: timestamp
  updatedAt: timestamp
}

// Session management (Better Auth)
session { id, token, userId, expiresAt, ipAddress, userAgent }

// OAuth accounts
account { id, providerId, userId, accessToken, refreshToken, ... }

// Email verification tokens
verification { id, identifier, value, expiresAt }
```

#### Onboarding & KYC

```typescript
// Investor questionnaire data
onboarding {
  id: string (PK)
  userId: string (FK → user)

  // Section 1: Investor Details
  organizationName: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  capitalProviderType: string  // "Family Office", "Institutional", etc.
  investorType: string         // "Individual", "Entity", etc.

  // Section 2: Accreditation
  accreditationStatus: string?
  accreditationMethod: string?
  entityTaxId: string?
  entitySignatoryName: string?

  // Sections 3-11: Investment preferences, mandate, sectors...
  // (See schema.ts for complete fields)

  // Legal & E-Sign
  legalDocumentsAcknowledged: boolean
  electronicSignatureName: string?
  electronicSignatureDate: string?

  // Status
  status: enum("draft", "submitted", "under_review", "approved", "rejected")
  submittedAt: timestamp?
  reviewedBy: string?
  reviewNotes: string?
}

// KYC document metadata
onboarding_document {
  id: string (PK)
  onboardingId: string (FK → onboarding)
  documentType: string   // "identification", "w9OrW8BEN", "accreditation"
  fileName: string
  fileSize: string
  fileType: string       // MIME type
  filePath: string       // Nextcloud path
  status: enum("pending", "approved", "rejected", "incorrect_doc", "needs_revision")
  reviewedBy: string?
}
```

#### Deals & Investments

```typescript
// Investment opportunity
deal {
  id: string (PK)
  name: string
  slug: string (unique)    // URL-friendly identifier
  description: string?
  teaserSummary: string?   // Card preview text

  // Classification
  sector: string?
  geography: string?
  dealType: string?        // "Equity", "Debt", "Real Estate"

  // Financial metrics
  targetRaise: double?
  minInvestment: double?
  targetIrr: double?       // e.g., 15.50 (%)
  targetMoic: double?      // e.g., 2.50x

  // State
  status: enum("draft", "coming_soon", "live", "closing", "funded", "exited", "cancelled")
  visibility: enum("public", "accredited", "invite_only")

  // Dates
  launchDate: timestamp?
  closeDate: timestamp?
  coverImageUrl: string?
}

// Curated deal invitations
deal_invite {
  id: string (PK)
  dealId: string (FK → deal)
  userId: string (FK → user)
  curationNote: string?    // Why this investor was invited
}

// Investor interest tracking
deal_interest {
  id: string (PK)
  dealId: string (FK → deal)
  userId: string (FK → user)
  status: enum("interested", "soft_committed", "pass", "meeting_requested")
  proposedAmount: double?
}

// Actual investments (portfolio)
investment {
  id: string (PK)
  dealId: string (FK → deal)
  userId: string (FK → user)

  // Commitment
  committedAmount: double
  committedDate: timestamp

  // Funding
  fundedAmount: double

  // Performance metrics
  currentValue: double?      // NAV
  distributions: double      // Cash returned
  ownershipPercentage: double?

  status: enum("committed", "active", "transferred", "liquidated", "written_off")
}

// Investment documents (K-1s, reports)
investment_document {
  id: string (PK)
  investmentId: string (FK → investment)
  documentType: string      // "k1", "quarterly_report", "annual_report"
  fileName: string
  filePath: string
  periodStart: timestamp?
  periodEnd: timestamp?
  year: string?
}
```

### Entity Relationships

```
user ─────┬───< session
          ├───< account
          ├───< onboarding ───< onboarding_document
          ├───< investment ───< investment_document
          ├───< deal_interest
          └───< deal_invite
                    │
                    └───> deal ───< deal_interest
                              └───< deal_invite
                              └───< investment
```

---

## File Storage with Nextcloud

### Overview

Nextcloud is used as a self-hosted file storage solution for sensitive documents. It provides:
- **WebDAV API**: Standard protocol for file operations
- **Self-hosted**: Full control over data location and security
- **Access Control**: User-based permissions
- **No Public URLs**: All files are private, accessed via authenticated API

### Configuration

```env
NEXTCLOUD_URL=https://your-nextcloud-instance.com
NEXTCLOUD_USER=service-account-username
NEXTCLOUD_PASSWORD=service-account-password
```

### Directory Structure

```
Nextcloud Root/
├── investors/
│   └── {userId}/
│       └── onboarding/
│           └── kyc-files/
│               ├── identification_passport.pdf
│               ├── w9.pdf
│               └── accreditation_letter.pdf
└── Deals/
    └── Deal_{slug}/
        ├── teaser.pdf
        ├── ppm.pdf
        └── subscription_agreement.pdf
```

### How Files Are Uploaded

#### 1. User Submits Onboarding Form

```typescript
// apps/web/trpc/routers/onboarding.ts

// Files are base64 encoded in the request
const job = await onboardingQueue.add("upload-onboarding-files", {
  onboardingId,
  investorId: userId,
  files: files.map((file) => ({
    documentType: file.documentType,
    fileName: file.name,
    fileBuffer: file.buffer,  // base64 encoded
    mimeType: file.type,
    size: file.size,
  })),
});
```

#### 2. Worker Processes Upload Job

```typescript
// apps/worker/handlers/onboarding-handler.ts

const client = createClient(
  `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
  {
    username: process.env.NEXTCLOUD_USER,
    password: process.env.NEXTCLOUD_PASSWORD,
  }
);

// Create folder structure
const folderPath = `/investors/${investorId}/onboarding/kyc-files`;
await client.createDirectory(folderPath, { recursive: true });

// Upload each file
for (const file of files) {
  const fileBuffer = Buffer.from(file.fileBuffer, "base64");
  await client.putFileContents(`${folderPath}/${fileName}`, fileBuffer, {
    overwrite: true,
    contentLength: fileBuffer.length,
  });
}
```

#### 3. Deal Folder Creation

```typescript
// apps/worker/lib/create-deal-folder.ts

// When a deal is created, a corresponding folder is made in Nextcloud
export async function createDealFolder(dealName: string) {
  const sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const folderName = `Deal_${sanitizedName}`;

  await axios({
    method: "MKCOL",  // WebDAV create collection
    url: `${NEXTCLOUD_URL}/remote.php/dav/files/${user}/Deals/${folderName}`,
    auth: { username, password },
  });

  return `/Deals/${folderName}`;
}
```

### WebDAV Operations Used

| Operation | HTTP Method | Purpose |
|-----------|-------------|---------|
| Create folder | `MKCOL` | Create directory structure |
| Upload file | `PUT` | Store file content |
| Delete folder | `DELETE` | Remove deal folders |
| Move/Rename | `MOVE` | Rename deal folders |
| Check exists | `PROPFIND` | Verify folder/file exists |

---

## Background Job Processing with BullMQ

### Overview

BullMQ is used for reliable, Redis-backed asynchronous job processing. This architecture ensures:
- **Reliability**: Jobs persist in Redis and survive server restarts
- **Scalability**: Multiple workers can process jobs concurrently
- **Retries**: Failed jobs are automatically retried with exponential backoff
- **Progress Tracking**: Jobs report progress that can be queried by clients

### Redis Configuration

```env
REDIS_URL=redis://localhost:6379  # or Redis cloud URL
```

### Queue Definitions

```typescript
// apps/web/lib/redis.ts

// Email queue with retry logic
export const emailQueue = new Queue("email-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

// Report generation queue
export const reportQueue = new Queue("report-queue", {
  connection: redis,
});

// Deal folder management queue
export const dealQueue = new Queue("deal-queue", {
  connection: redis,
});

// Onboarding file upload queue with retry
export const onboardingQueue = new Queue("onboarding-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});
```

### Worker Configuration

```typescript
// apps/worker/index.ts

const connection = new IORedis(process.env.REDIS_URL);

// Report worker - high concurrency
const reportWorker = new Worker("report-queue", reportHandler, {
  connection,
  concurrency: 10,
});

// Deal worker - high concurrency
const dealWorker = new Worker("deal-queue", dealHandler, {
  connection,
  concurrency: 10,
});

// Onboarding worker - moderate concurrency (file uploads are heavy)
const onboardingWorker = new Worker("onboarding-queue", onboardingHandler, {
  connection,
  concurrency: 5,
});

// Email worker - high concurrency
const emailWorker = new Worker("email-queue", emailHandler, {
  connection,
  concurrency: 10,
});
```

### Job Types & Handlers

#### 1. Onboarding File Upload

```typescript
// Handler: apps/worker/handlers/onboarding-handler.ts

interface OnboardingFileJobData {
  onboardingId: string;
  investorId: string;
  files: Array<{
    documentType: string;
    fileName: string;
    fileBuffer: string;  // base64
    mimeType: string;
    size: number;
  }>;
}

// Features:
// - Creates Nextcloud folder structure
// - Uploads files with progress tracking
// - Validates file sizes and buffers
// - Reports progress (0-100%) to client
```

#### 2. Email Sending

```typescript
// Handler: apps/worker/handlers/email-handler.ts

type EmailJobData =
  | OnboardingInvestorConfirmationJobData
  | OnboardingAdminNotificationJobData;

// Process:
// 1. Receive job with email type and data
// 2. Render React Email template
// 3. Send via Resend API
```

#### 3. Deal Folder Management

```typescript
// Handler: apps/worker/handlers/deal-handler.ts

// Job names:
// - "create-deal": Creates /Deals/Deal_{slug}/ folder
// - "rename-deal": Renames folder when deal name changes
// - "delete-deal": Removes folder when deal is deleted
```

### Job Persistence & Retention

```typescript
// Jobs are configured with retention policies
await onboardingQueue.add("upload-onboarding-files", data, {
  removeOnComplete: {
    age: 24 * 3600,    // Keep completed jobs for 24 hours
    count: 1000,       // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
  },
});
```

### Querying Job Status

```typescript
// apps/web/trpc/routers/onboarding.ts

getJobProgress: protectedProcedure
  .input(z.object({ jobId: z.string() }))
  .query(async ({ input, ctx }) => {
    const job = await onboardingQueue.getJob(input.jobId);

    // Verify ownership
    if (job.data.investorId !== ctx.userId) {
      throw new Error("Unauthorized");
    }

    return {
      jobId: job.id,
      state: await job.getState(),  // "waiting" | "active" | "completed" | "failed"
      progress: job.progress,        // 0-100
      returnvalue: job.returnvalue,  // Result if completed
      failedReason: job.failedReason,
    };
  }),
```

### Health Check Server

The worker runs a minimal HTTP server for container health checks:

```typescript
// apps/worker/index.ts

Bun.serve({
  port: parseInt(process.env.PORT || "8080"),
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "bullmq-worker",
        timestamp: new Date().toISOString(),
      }));
    }
    return new Response("Not Found", { status: 404 });
  },
});
```

---

## Email System

### Architecture

Emails are processed asynchronously through BullMQ:

```
tRPC Mutation → emailQueue.add() → Redis → Worker → Resend API
```

### Email Templates

Located in `packages/mail/emails/`:

1. **OnboardingInvestorConfirmation**: Sent to investor after submission
2. **OnboardingAdminNotification**: Sent to admin team for review

### Configuration

```typescript
// packages/mail/types.ts

export const EMAIL_CONFIG = {
  from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
  defaultAdminEmail: "admin@darkalphacapital.com",
} as const;
```

### Sending Flow

```typescript
// 1. Queue email job (apps/web)
await emailQueue.add("onboarding-investor-confirmation", {
  type: "onboarding-investor-confirmation",
  to: investorEmail,
  primaryContactName: "John Doe",
  organizationName: "Acme Capital",
});

// 2. Worker processes job (apps/worker)
const { subject, html } = await renderEmailTemplate(jobData);
await resend.emails.send({
  from: EMAIL_CONFIG.from,
  to: jobData.to,
  subject,
  html,
});
```

### Direct Email Sending

For immediate emails (auth, password reset):

```typescript
import { sendEmailDirect } from "@repo/mail";

await sendEmailDirect(
  user.email,
  "Reset your password",
  `<p>Click the link: <a href="${url}">${url}</a></p>`
);
```

---

## API Layer (tRPC)

### Router Structure

```
apps/web/trpc/
├── init.ts           # tRPC initialization, procedures
└── routers/
    ├── _app.ts       # Root router (merges all routers)
    ├── admin.ts      # Admin-only operations
    ├── auth.ts       # Authentication queries
    ├── deals.ts      # Deal CRUD and marketplace
    ├── onboarding.ts # Onboarding submission
    └── user.ts       # User profile operations
```

### Procedure Types

```typescript
// apps/web/trpc/init.ts

// Public procedures (no auth required)
export const baseProcedure = t.procedure;

// Requires authenticated user
export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session, userId: ctx.userId! } });
});

// Requires admin role
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
```

### Context

```typescript
export const createTRPCContext = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  return {
    db,                           // Drizzle client
    session,                      // User session or null
    userId: session?.user.id,     // User ID or null
  };
});
```

### Key Endpoints

| Router | Procedure | Access | Purpose |
|--------|-----------|--------|---------|
| `onboarding` | `submit` | Protected | Submit onboarding form |
| `onboarding` | `getJobProgress` | Protected | Check file upload status |
| `admin` | `getInvestors` | Admin | Paginated investor list |
| `admin` | `getAdmins` | Admin | Paginated admin list |
| `admin` | `getDeals` | Admin | Paginated deal list |
| `deals` | `getDeals` | Protected | Get all deals |
| `deals` | `create` | Admin | Create new deal |
| `deals` | `update` | Admin | Update deal |
| `deals` | `delete` | Admin | Delete deal |

---

## Current Features

### Implemented

- [x] User registration (email/password + Google OAuth)
- [x] Email verification
- [x] Password reset flow
- [x] Role-based access control (admin vs investor)
- [x] Multi-step onboarding wizard (11 sections)
- [x] KYC document upload to Nextcloud
- [x] KYC status tracking (review/approved/pending_docs/rejected)
- [x] Dashboard with KYC-status-based views
- [x] Admin dashboard with investor/admin/deal tables
- [x] Deal CRUD operations
- [x] Deal visibility controls (public/accredited/invite-only)
- [x] Deal folder creation in Nextcloud
- [x] BullMQ job processing for files and emails
- [x] Email notifications (investor confirmation, admin alerts)
- [x] Prismic CMS integration for marketing pages

### Data Model Ready (UI Pending)

- [ ] Deal interest tracking (soft commits)
- [ ] Deal invitations (curation)
- [ ] Investment portfolio tracking
- [ ] Investment documents (K-1s, reports)
- [ ] Portfolio dashboard with NAV/distributions

### Planned

- [ ] Document preview/download from Nextcloud
- [ ] KYC document review interface for admins
- [ ] Deal document management
- [ ] Investor-deal matching/recommendations
- [ ] Capital call tracking
- [ ] Distribution management
- [ ] Reporting and analytics

---

## Environment Variables Reference

### Required for All Apps

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_URL=postgresql://user:pass@host:5432/db

# Redis (BullMQ)
REDIS_URL=redis://localhost:6379

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Email
RESEND_API_KEY=re_xxx
ADMIN_NOTIFICATION_EMAIL=admin@darkalphacapital.com

# File Storage
NEXTCLOUD_URL=https://nextcloud.example.com
NEXTCLOUD_USER=service-account
NEXTCLOUD_PASSWORD=xxx
```

### Server-Specific (apps/server)

```env
GCLOUD_PROJECT_ID=your-project
GCS_CLIENT_EMAIL=sa@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GCLOUD_BUCKET=your-bucket
```

---

*Last updated: January 2025*

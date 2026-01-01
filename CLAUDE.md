# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **DarkAlpha Capital Investor Portal** - a private equity/venture capital platform for investor onboarding, KYC management, deal marketplace, and portfolio tracking. It's a Turborepo monorepo using Bun as the package manager and runtime.

## Commands

### Development

```bash
bun install              # Install dependencies
bun run dev              # Start all apps in development mode (turbo)
bun run build            # Build all apps
bun run lint             # Lint all apps
bun run check-types      # TypeScript type checking
bun run format           # Format code with Prettier
```

### Individual Apps

```bash
# Web (Next.js)
cd apps/web && bun run dev

# Server (Hono API)
cd apps/server && bun run dev

# Worker (BullMQ)
cd apps/worker && bun run dev
```

### Database (packages/db)

```bash
cd packages/db
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema to database (dev)
bun run db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Monorepo Structure

- **apps/web**: Next.js 16 frontend with App Router, React 19, tRPC client
- **apps/server**: Hono API server (Bun runtime) for file handling and onboarding submission
- **apps/worker**: BullMQ background job processor for reports, deals, onboarding, and emails
- **packages/db**: Drizzle ORM schema and database package (`@repo/db`)
- **packages/mail**: Email sending with React Email templates (`@repo/mail`)
- **packages/ui**: Shared UI components (currently minimal)
- **packages/typescript-config**: Shared TypeScript configs
- **packages/eslint-config**: Shared ESLint configs

### Key Technologies

- **Auth**: Better Auth with Google OAuth, email/password, and email verification
- **Database**: PostgreSQL via Drizzle ORM
- **API**: tRPC for web app, Hono for server
- **Queue**: BullMQ with Redis
- **Storage**: Google Cloud Storage and Nextcloud (WebDAV)
- **Email**: Resend with React Email templates
- **UI**: Tailwind CSS v4, shadcn/ui components, Radix UI primitives

### Data Flow

1. **Web App** (`apps/web`) handles UI and tRPC API routes
2. **tRPC routers** (`apps/web/trpc/routers/`) define procedures for auth, users, deals, onboarding
3. **Server** (`apps/server`) handles file operations and heavy processing
4. **Worker** (`apps/worker`) processes background jobs via BullMQ queues

### Worker Queues

The worker (`apps/worker`) processes four BullMQ queues:
- `report-queue`: Report generation (concurrency: 10)
- `deal-queue`: Deal-related processing (concurrency: 10)
- `onboarding-queue`: Document uploads and KYC processing (concurrency: 5)
- `email-queue`: Email sending (concurrency: 10)

To add a new queue: create a handler in `apps/worker/handlers/`, import it in `apps/worker/index.ts`, and register a new `Worker` instance with the queue name.

### Database Schema (packages/db/schema.ts)

Core entities:

- `user`, `session`, `account`, `verification`: Authentication (Better Auth)
- `onboarding`, `onboardingDocument`: Investor KYC workflow
- `deal`, `dealInvite`, `dealInterest`: Deal marketplace
- `investment`, `investmentDocument`: Portfolio holdings

Key enums: `kyc_status`, `document_status`, `deal_status`, `deal_visibility`, `investment_status`, `interest_status`

### Authentication

- Better Auth configured in `apps/web/auth.ts`
- Admin role auto-assigned to `@darkalphacapital.com` emails
- tRPC procedures: `baseProcedure`, `protectedProcedure`, `adminProcedure` in `apps/web/trpc/init.ts`

### Route Structure (apps/web/app/)

- `(auth)/`: Login, register, verify-email, password reset
- `(dashboard)/`: Protected investor routes (dashboard, deals, onboarding, profile)
- `(dashboard)/(admin)/`: Admin-only routes
- `(main-site)/`: Public marketing pages
- `api/`: API routes including `/api/trpc/[trpc]` and `/api/auth/*`

## Environment Variables

Required for build (from turbo.json):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: Auth config
- `DATABASE_URL`, `POSTGRES_URL`: PostgreSQL connection
- `NEXTCLOUD_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_PASSWORD`: WebDAV storage
- `REDIS_URL`: BullMQ queue
- `RESEND_API_KEY`: Email service

Server-specific (apps/server):

- `GCLOUD_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`, `GCLOUD_BUCKET`: GCS storage

## Important Patterns

### Package Imports

- Database: `@repo/db` with exports `.`, `./schema`, `./queries`
- Mail: `@repo/mail` with exports `.`, `./emails`, `./types`

### tRPC Context

tRPC context includes `db`, `session`, and `userId` - see `apps/web/trpc/init.ts`

### File Uploads

File uploads go through the worker queue for async processing via BullMQ

### CMS Integration

Prismic CMS is integrated for marketing content (see `slices/` directory)

### Hono Server Type Export

The server exports `AppType` for type-safe client usage:
```typescript
import type { AppType } from "server";
```

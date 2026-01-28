# Repository Guidelines

## Project Structure & Module Organization

- `apps/web/`: Next.js (App Router) frontend. Key areas: `app/` (routes), `components/`, `slices/` (Prismic), `trpc/`, `lib/`, `public/`.
- `apps/server/`: Bun + Hono server (`index.ts`, `routes/`, `lib/`). Used for storage/util routes and health checks.
- `apps/worker/`: Bun worker for background jobs (BullMQ). Handlers in `handlers/`, shared utilities in `lib/`.
- `packages/ui/`: Shared React UI components exported from `src/`.
- `packages/db/`: Database package (schema/queries) with Drizzle migrations in `lib/migrations/`.
- `packages/mail/`: Email templates and types (`emails/`, `types.ts`).
- `packages/eslint-config/` and `packages/typescript-config/`: Shared lint + TS configs used across workspaces.

## Build, Test, and Development Commands

This repo is a Turborepo monorepo and uses Bun (`packageManager: bun@…`).

- `bun install`: Install workspace dependencies.
- `bun run dev`: Run `dev` for all relevant workspaces via Turbo.
- `cd apps/web && bun run dev`: Run the Next.js app only.
- `bun run build`: Build all apps/packages via Turbo.
- `bun run lint`: Lint workspaces (ESLint).
- `bun run check-types`: Typecheck workspaces that define a `check-types` script.
- `bun run format`: Prettier write for `**/*.{ts,tsx,md}`.
- `cd packages/db && bun run db:migrate`: Run Drizzle migrations (also: `db:generate`, `db:push`, `db:studio`).

## Coding Style & Naming Conventions

- Language: TypeScript; server/worker are ESM (`"type": "module"`).
- Lint: ESLint (flat config). Prefer shared rules from `@repo/eslint-config`.
- Format: Prettier; don’t hand-format (run `bun run format`).
- Naming: React components `PascalCase`; files follow existing `kebab-case.tsx` patterns; env vars `UPPER_SNAKE_CASE`.

## Testing Guidelines

There is no dedicated unit/e2e test runner configured (no Jest/Vitest/Playwright config in-repo). Treat `bun run lint` and `bun run check-types` as the baseline “tests”, and add a test framework + scripts when introducing new critical logic.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commit-style prefixes (examples in history): `feat:`, `fix:`, `refactor:`, `chore:` (optional scope).
- PRs: include a clear description, steps to verify locally, and screenshots for UI changes. If you add/rename env vars, update the relevant `.env.example` and mention it in the PR.

## Security & Configuration Tips

- Keep secrets out of git; prefer `.env*` files locally and Vercel/hosting environment variables in deployment.
- Be careful with credential files (e.g., `investor-portal-key.json`): treat as sensitive and avoid sharing in logs or PRs.

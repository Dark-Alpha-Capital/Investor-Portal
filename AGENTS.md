# AGENTS.md

Investor portal for Dark Alpha Capital: Bun + Turborepo monorepo. The app is **TanStack Start (React) + Vite**, deployed to **Cloudflare Workers** with **D1 (SQLite)/Drizzle**, better-auth, tRPC, Prismic CMS, Nextcloud file storage, Resend email, and Cloudflare Queues/Workflows.

## First, read this

- **`README.md` is stale.** It describes a Next.js + Prisma + AWS S3 plan from the project's early phase. Trust config and code, not the README.
- **Package manager is Bun** (`bun@1.2.22`). Use `bun install`, `bun run`, `bunx`, `bun test`. `bun.lock` is canonical; the old `bun.lockb` and `package-lock.json` are stale — don't edit them.
- **The web app's package name is `pass-the-hat`** (in `apps/web/package.json`), not "web" or "investor-portal". Turbo filters reference it (root `test` uses `--filter=pass-the-hat`).

## Commands

```bash
bun run dev            # turbo dev; in apps/web also boots Prismic Slice Machine alongside vite
bun run test           # turbo transit --filter=pass-the-hat (bun test)
bun run lint           # turbo lint
bun run check-types    # turbo check-types (tsc --noEmit)
bun run build          # turbo build
```

- Run a single test: `bun test path/to/file.test.ts` from `apps/web` (tests use `bun:test`, e.g. `apps/web/lib/helpers/sanitize-html.test.ts`).
- Deploy to production: from `apps/web`, `bun run deploy` (`vite build && wrangler deploy`). Production DB is remote D1.
- First-time local DB setup: from `packages/db`, `bun run db:setup:local` (applies migrations to local D1 under `apps/web/.wrangler/state/`).

## Repo layout

- `apps/web` — the only real app (no `src/`; TanStack Start configured with `srcDirectory: "."` in `vite.config.ts`). Source is at the app root.
- `packages/db` (`@repo/db`) — Drizzle schema, migrations, queries. Subpath exports: `@repo/db`, `@repo/db/schema`, `@repo/db/queries`, `@repo/db/deal-marketplace`, etc.
- `packages/mail` (`@repo/mail`) — Resend email templates/sending.
- `packages/ai-core` (`@repo/ai-core`) — chat model registry, prompts, tools.
- `packages/nextcloud` (`@repo/nextcloud`) — Nextcloud file APIs (KYC/deal-folder documents).
- `packages/ui`, `eslint-config`, `typescript-config` — shared UI/eslint/tsconfig. `apps/agent` is empty.

## App wiring (how the pieces connect)

- **Routing**: `apps/web/routes/` (TanStack Router). `routeTree.gen.ts` and `prismicio-types.d.ts` are codegen'd but committed — after adding a route, run dev/build to regenerate. The vite config ignores `components|steps|hooks|utils|error.tsx|sitemap.ts|robots.ts` as route files.
- **Cloudflare Worker entry**: `apps/web/cloudflare-worker.ts` (`main` in `wrangler.jsonc`). It exports the OnboardingKycWorkflow and attaches the Queues consumer (`handleAsyncJobQueue` in `lib/queues/consume.ts`). Wrangler bindings (D1 `DB`, Workflows, Queues) are declared in `apps/web/wrangler.jsonc`.
- **Auth**: better-auth in `apps/web/auth.ts`. Admin role is derived from email domain: `@darkalphacapital.com` → `admin`, else `user`. `requireEmailVerification` is on.
- **Route loaders / server fns**: TanStack Start route loaders and layouts also execute on the client, so auth/session-guard logic must run through server fns. Convention is three files per area: `lib/server-fns/<area>-route-data.ts` (types), `.server.ts` (implementation, e.g. `investor-route-data.server.ts`), `.functions.ts` (`createServerFn` wrappers). Admin-guarded fns use `adminOnlyServerFnMiddleware` (`lib/middleware/admin-only-server-fn.ts`).
- **tRPC**: routers in `trpc/routers/`, mounted at catch-all `routes/api/trpc/$.ts`. Uses `superjson` transformer; use `protectedProcedure`/`adminProcedure` (`trpc/init.ts`) rather than raw `baseProcedure` for authed endpoints.

## Gotchas

- **3 MiB gzip Worker limit**: heavy client-only deps (shiki, mermaid, katex, cytoscape, tiptap, streamdown) are stubbed out of the SSR bundle by `lib/ssr-stubs/vite-plugin.ts` (must stay first in the plugin list). Importing them from server code yields the stub. Add new heavy client-only packages to that stub map.
- **Never call `drizzle-kit` directly**; use the `db:*` scripts in `packages/db` (`db:generate`, `db:migrate:local`, `db:migrate:remote`, `db:push`, `db:studio`). They set `DRIZZLE_DB_URL` to the local Wrangler D1 file. `db:studio` requires a local migration to have run first.
- **`DATABASE_URL` is a legacy no-op**: the Postgres env var in `apps/web/.env` is unused — the schema is D1/SQLite (`drizzle(env.DB)` in `packages/db/index.ts`).
- **Env**: server-only secrets live in `apps/web/.dev.vars` (gitignored; copy `apps/web/.dev.vars.example`). Client-visible vars use `VITE_PUBLIC_*` in `.env`. Wrangler injects the production `BETTER_AUTH_URL`/`VITE_PUBLIC_*` vars from `wrangler.jsonc`.
- **Email is async/queued**: outbound mail goes through a Cloudflare Queue outbox pattern (`lib/queues/`, `lib/workflows/workflow-outbox`), not just direct Resend calls. Retries/acks are per-message in `lib/queues/consume.ts`.

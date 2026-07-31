# @repo/db

Cloudflare D1 (SQLite) schema, migrations, and queries for the investor portal.

## Local development vs production

| Environment | Database | How |
|-------------|----------|-----|
| **Local dev** (`vite dev`) | Local D1 SQLite | Wrangler persists under `apps/web/.wrangler/state/` |
| **Production** (`wrangler deploy`) | Remote D1 | Cloudflare binding in `apps/web/wrangler.jsonc` |
| **Drizzle Studio** | Same file as local dev | Resolved automatically from Wrangler state |

Production deploy always uses the remote D1 instance. Local dev no longer forces `remote: true`.

## First-time local setup

From `packages/db`:

```bash
bun run db:setup:local
```

This applies migrations to a **local** SQLite database (not production).

## Drizzle Studio

```bash
cd packages/db
bun run db:studio
```

Requires `db:migrate:local` (or at least one local migration run) first.

## Common commands

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations locally (dev + studio)
bun run db:migrate:local

# Apply migrations to production D1 (use with care)
bun run db:migrate:remote

# Push schema directly to local DB (dev only)
bun run db:push
```

## Notes

- Do **not** call `drizzle-kit` directly; use the `db:*` scripts so `DRIZZLE_DB_URL` points at the local Wrangler D1 file.
- `.wrangler/` is gitignored; each developer gets their own local DB after `db:migrate:local`.
- The legacy `DATABASE_URL` Postgres env var in `apps/web/.env` is unused by this app (schema is D1/SQLite).

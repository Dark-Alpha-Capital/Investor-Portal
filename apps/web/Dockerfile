# syntax=docker.io/docker/dockerfile:1

FROM --platform=linux/amd64 node:20-slim AS base
WORKDIR /app

# 1) Prune the monorepo down to just the web app + its deps
FROM base AS prune
# Pin turbo version to match package.json
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune pass-the-hat --docker

# 2) Install dependencies in the pruned workspace
FROM base AS deps
WORKDIR /app

# Use the pruned package manifests to install deps
COPY --from=prune /app/out/json/ .
# Use npm install (works without lockfiles, unlike npm ci)
# Project uses Bun primarily, so lockfiles may not be perfectly maintained for npm
RUN npm install --legacy-peer-deps

# 3) Build the application from the pruned workspace
FROM base AS builder
WORKDIR /app

# Reuse node_modules from deps and copy pruned full source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prune /app/out/full/ .
COPY turbo.json turbo.json

# Next.js/Turborepo build-time configuration
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBOPACK_ROOT=/app

# Build-time arguments for environment variables needed during `next build`
# NOTE: These are provided by docker-compose via `build.args` and must be set
# in the environment (or root .env) where `docker compose` is run.
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG DATABASE_URL
ARG REDIS_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GCLOUD_PROJECT_ID
ARG GCS_CLIENT_EMAIL
ARG GCS_PRIVATE_KEY
ARG GCLOUD_BUCKET
ARG RESEND_API_KEY
ARG NEXTCLOUD_URL
ARG NEXTCLOUD_USER
ARG NEXTCLOUD_PASSWORD

# Build the Next.js app directly (no need for turbo after pruning)
WORKDIR /app/apps/web
RUN NEXT_PUBLIC_BETTER_AUTH_URL="$NEXT_PUBLIC_BETTER_AUTH_URL" \
    DATABASE_URL="$DATABASE_URL" \
    REDIS_URL="$REDIS_URL" \
    BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
    GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
    GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
    GCLOUD_PROJECT_ID="$GCLOUD_PROJECT_ID" \
    GCS_CLIENT_EMAIL="$GCS_CLIENT_EMAIL" \
    GCS_PRIVATE_KEY="$GCS_PRIVATE_KEY" \
    GCLOUD_BUCKET="$GCLOUD_BUCKET" \
    RESEND_API_KEY="$RESEND_API_KEY" \
    NEXTCLOUD_URL="$NEXTCLOUD_URL" \
    NEXTCLOUD_USER="$NEXTCLOUD_USER" \
    NEXTCLOUD_PASSWORD="$NEXTCLOUD_PASSWORD" \
    npm run build

# 4) Runtime image: Node.js running Next.js standalone output
FROM --platform=linux/amd64 node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run production as root for security reasons
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 nextjs

# Copy the built Next.js standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["sh", "-c", "if [ -f ./apps/web/server.js ]; then node ./apps/web/server.js; elif [ -f ./server.js ]; then node ./server.js; else echo 'Error: server.js not found' && ls -la && exit 1; fi"]

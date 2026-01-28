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

# Build-time arguments for NEXT_PUBLIC_ variables
ARG NEXT_PUBLIC_BETTER_AUTH_URL

# Convert ARGs to ENVs so the build process can access them
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}

# Build the Next.js app directly (no need for turbo after pruning)
WORKDIR /app/apps/web
RUN npm run build

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
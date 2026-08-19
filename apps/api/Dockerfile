# Multi-stage build using Turborepo's `prune` to ship only what apps/api needs.
# Build context must be the monorepo root: `docker build -f apps/api/Dockerfile .`

FROM node:20-alpine AS base
RUN corepack enable

# --- Prune: extract just the apps/api subgraph (its own files + workspace deps) ---
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @obliq/api --docker

# --- Install & build using the pruned lockfile/sources ---
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@obliq/api

# --- Runtime image ---
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 obliq
USER obliq

COPY --from=installer --chown=obliq:nodejs /app .

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

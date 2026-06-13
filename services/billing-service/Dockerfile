FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared-db/package.json ./packages/shared-db/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-observability/package.json ./packages/shared-observability/
COPY packages/shared-rbac/package.json ./packages/shared-rbac/
COPY packages/shared-auth/package.json ./packages/shared-auth/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-events/package.json ./packages/shared-events/
COPY services/billing-service/package.json ./services/billing-service/
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services ./services
COPY tsconfig.base.json tsconfig.json ./
COPY services/billing-service/tsconfig.json ./services/billing-service/
COPY packages/shared-db/tsconfig.json ./packages/shared-db/
COPY packages/shared-logger/tsconfig.json ./packages/shared-logger/
COPY packages/shared-observability/tsconfig.json ./packages/shared-observability/
COPY packages/shared-rbac/tsconfig.json ./packages/shared-rbac/
COPY packages/shared-auth/tsconfig.json ./packages/shared-auth/
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-events/tsconfig.json ./packages/shared-events/
COPY services/billing-service/src ./services/billing-service/src
COPY packages/shared-db/src ./packages/shared-db/src
COPY packages/shared-logger/src ./packages/shared-logger/src
COPY packages/shared-observability/src ./packages/shared-observability/src
COPY packages/shared-rbac/src ./packages/shared-rbac/src
COPY packages/shared-auth/src ./packages/shared-auth/src
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-events/src ./packages/shared-events/src

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 longox
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/billing-service ./services/billing-service
USER longox
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3004/healthz || exit 1
CMD ["node", "--import", "tsx", "services/billing-service/src/standalone.ts"]

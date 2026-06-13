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
COPY packages/shared-queue/package.json ./packages/shared-queue/
COPY packages/shared-realtime/package.json ./packages/shared-realtime/
COPY packages/shared-cache/package.json ./packages/shared-cache/
COPY packages/shared-events/package.json ./packages/shared-events/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/workflow-engine/package.json ./packages/workflow-engine/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/shared-auth/package.json ./packages/shared-auth/
COPY services/execution-service/package.json ./services/execution-service/
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services ./services
COPY tsconfig.base.json tsconfig.json ./
COPY services/execution-service/tsconfig.json ./services/execution-service/
COPY packages/shared-db/tsconfig.json ./packages/shared-db/
COPY packages/shared-logger/tsconfig.json ./packages/shared-logger/
COPY packages/shared-observability/tsconfig.json ./packages/shared-observability/
COPY packages/shared-rbac/tsconfig.json ./packages/shared-rbac/
COPY packages/shared-queue/tsconfig.json ./packages/shared-queue/
COPY packages/shared-realtime/tsconfig.json ./packages/shared-realtime/
COPY packages/shared-cache/tsconfig.json ./packages/shared-cache/
COPY packages/shared-events/tsconfig.json ./packages/shared-events/
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/workflow-engine/tsconfig.json ./packages/workflow-engine/
COPY packages/api-zod/tsconfig.json ./packages/api-zod/
COPY packages/shared-auth/tsconfig.json ./packages/shared-auth/
COPY services/execution-service/src ./services/execution-service/src
COPY packages/shared-db/src ./packages/shared-db/src
COPY packages/shared-logger/src ./packages/shared-logger/src
COPY packages/shared-observability/src ./packages/shared-observability/src
COPY packages/shared-rbac/src ./packages/shared-rbac/src
COPY packages/shared-queue/src ./packages/shared-queue/src
COPY packages/shared-realtime/src ./packages/shared-realtime/src
COPY packages/shared-cache/src ./packages/shared-cache/src
COPY packages/shared-events/src ./packages/shared-events/src
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/workflow-engine/src ./packages/workflow-engine/src
COPY packages/api-zod/src ./packages/api-zod/src
COPY packages/shared-auth/src ./packages/shared-auth/src

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 longox
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/execution-service ./services/execution-service
USER longox
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3002/healthz || exit 1
CMD ["node", "--import", "tsx", "services/execution-service/src/standalone.ts"]

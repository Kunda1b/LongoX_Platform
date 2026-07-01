---
name: Section 29.2 architecture contracts
description: File locations, codegen wiring, and Prisma decisions established when source-controlling the architecture contracts.
---

## Canonical file locations

| Contract | File |
|---|---|
| Gateway REST API (OpenAPI 3.1) | `services/api-gateway/openapi/openapi.yaml` |
| Gateway TypeScript types (hand-managed, replaced by codegen) | `packages/shared-types/src/generated/gateway-api.d.ts` |
| Gateway TypeScript types (api-gateway-local) | `services/api-gateway/openapi/generated/gateway-api.d.ts` |
| Prisma canonical schema | `packages/shared-db/prisma/schema.prisma` |
| GraphQL SDL | `services/api-gateway/graphql/schema.graphql` |
| GraphQL base types (generated) | `services/api-gateway/src/graphql/generated/types.ts` |
| GraphQL resolver types (generated) | `services/api-gateway/src/graphql/generated/resolvers.ts` |
| GraphQL operation types (generated) | `services/api-gateway/src/graphql/generated/operations.ts` |
| GraphQL context interface | `services/api-gateway/src/lib/context.ts` |
| GraphQL codegen config | `services/api-gateway/graphql/codegen.ts` |

## Codegen pipelines

Root `pnpm run codegen` now chains three pipelines in order:
1. `pnpm --filter @longox/api-spec run codegen` — Orval hooks + Zod schemas (existing)
2. `pnpm --filter @longox/api-gateway run codegen` — GraphQL resolver/operation types + openapi-typescript gateway types
3. `pnpm --filter @longox/shared-types run codegen` — copies gateway-api.d.ts to shared-types for cross-package use

## Prisma schema decisions

- Covers all 40+ Section 10 tables; Drizzle at `lib/db/` is the compatibility layer and must not be extended for new tables
- pgvector columns use `Unsupported("vector(1536)")` since Prisma has no native pgvector support
- New packages declared in `packages/shared-db/package.json`: `@prisma/client@^6`, `prisma@^6` (devDep)

## New devDependencies declared (pending pnpm install)

- `services/api-gateway`: `@graphql-codegen/typescript-resolvers@^4`, `@graphql-codegen/typescript-operations@^4`, `openapi-typescript@^7`
- `packages/shared-types`: `openapi-typescript@^7`
- `packages/shared-db`: `@prisma/client@^6` (dep), `prisma@^6` (devDep)

**Why:** pnpm install from workspace root was timing out in the sandbox during the session; packages are declared and will install on the next normal pnpm install. Do not use `cd <pkg> && pnpm add` — triggers corepack SIGABRT.

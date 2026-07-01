# Milestone A — Repository Stabilization

Status tracker for rollout item 1 in `IMPLEMENTATION_PLAN.md`.

## Exit criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Root typecheck passes | 🟡 | `packages/api-zod/tsconfig.json` wired; run `pnpm run typecheck` |
| CI gates fail on error | ✅ | lint, typecheck, api-contract, graphql-check, test, build |
| OpenAPI contracts generated | ✅ | `lib/api-spec/openapi.yaml` + Orval → `api-client-react` |
| GraphQL schema at gateway boundary | ✅ | `services/api-gateway/graphql/schema.graphql` |
| GraphQL TypeScript types generated | ✅ | `pnpm --filter @longox/api-gateway run graphql:codegen` |
| Unit / contract tests | ✅ | Vitest: workflow-engine + OpenAPI contract |
| Playwright smoke tests | ✅ | `e2e/smoke.spec.ts` via `pnpm test:e2e` |
| Dev environment boots | 🟡 | `docker-compose.distributed.yml` + `apps/web/Dockerfile`; local: README quick start |
| Stale autoflow/flowbuilder removed | ✅ | CI/Helm/K8s use LongoX naming |
| Implementation matrix tracked | ✅ | `docs/IMPLEMENTATION_MATRIX.md` |

## Commands

```bash
pnpm install --ignore-scripts
pnpm run typecheck
pnpm test
pnpm test:e2e          # starts web dev server unless PLAYWRIGHT_SKIP_WEBSERVER=1
pnpm run codegen       # regenerate OpenAPI clients
pnpm --filter @longox/api-gateway run graphql:codegen
```

## Remaining before Milestone B

- Confirm full `pnpm run typecheck` green across all packages
- Add integration tests for auth + workflow happy path
- Wire `docker-compose.distributed.yml` smoke boot in CI (optional)

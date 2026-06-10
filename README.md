# Flow-Builder-Nexus

A multi-tenant SaaS platform combining **workflow automation**, a **connector marketplace**, and a **low-code internal tools builder** — powered by an AI-native architecture.

## Monorepo Structure

```
apps/               — Frontend applications
  web/              — Main SaaS app (React + Vite)
services/           — Backend services
  api-gateway/      — Express API server
packages/           — Shared libraries
  shared-db/        — Drizzle ORM schema + DB client
  api-spec/         — OpenAPI specification
  api-zod/          — Zod validation schemas (codegen'd)
  api-client-react/ — React Query hooks (codegen'd)
connectors/         — Connector marketplace packages
templates/          — Workflow/dashboard templates
infrastructure/     — Terraform, K8s, Helm configs
tools/              — Dev tooling
scripts/            — Workspace scripts
```

## Run & Operate

- `pnpm --filter @autoflow/api-gateway run dev` — run the API server
- `pnpm --filter @autoflow/web run dev` — run the frontend
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages

## Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **API:** Express 5 (Node.js)
- **DB:** PostgreSQL + Drizzle ORM
- **Queues:** Redis + BullMQ
- **Validation:** Zod

## License

MIT

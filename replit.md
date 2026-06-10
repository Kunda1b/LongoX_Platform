# LongoX

A low-code automation + internal tools platform for SMBs — workflow automation (n8n-style) with a connector marketplace, plus a drag-drop internal tools builder.

## Run & Operate

- `pnpm --filter @longox/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @longox/flowcraft run dev` — run the frontend (port 25075)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @longox/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @longox/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, served at `/`
- API: Express 5, served at `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (workflows, executions, connectors, apps)
- `artifacts/api-server/src/routes/` — Express route handlers (dashboard, workflows, executions, connectors, apps)
- `artifacts/flowcraft/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation

## Architecture decisions

- OpenAPI-first: spec in `lib/api-spec/openapi.yaml` gates all codegen; never hand-write hooks or schemas
- `connectors/categories` route placed BEFORE `connectors/:id` in router to avoid Express matching "categories" as an id
- Workflow run endpoint simulates execution with random success/failure and inserts a real execution row
- App stats endpoint computed on-the-fly from the apps table (no separate stats table)

## Product

- **Workflow automation**: Create, manage, and run multi-step workflows triggered by schedules, webhooks, or third-party events
- **Connector Marketplace**: 15 pre-loaded connectors (Slack, GitHub, Stripe, Google Sheets, etc.) with install flow
- **Internal Tools Builder**: Create and manage dashboards, CRUD apps, forms, and reports
- **Execution History**: Full audit log of all workflow runs with step-level detail

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Route order matters: `/connectors/categories` must be registered before `/connectors/:id`
- Route order matters: `/apps/stats` must be registered before `/apps/:id`
- After any OpenAPI spec change, run `pnpm --filter @longox/api-spec run codegen` before touching routes or frontend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# LongoX Platform

A multi-tenant SaaS platform combining **workflow automation**, an **AI-native agent runtime**, a **connector marketplace**, and **low-code internal tools** — built with a microservices architecture.

## Monorepo Structure

```
apps/web/              — Next.js 15 SaaS frontend
services/              — 18 backend microservices
  api-gateway/         — Express API gateway
  ai-service/          — AI agent routing & providers
  auth-service/        — Authentication & SSO
  billing-service/     — Stripe billing & plan management
  workflow-service/    — Workflow execution engine
  execution-service/   — Workflow runner with BullMQ
  connector-service/   — Connector lifecycle management
  marketplace-service/ — Listing, install, revenue sharing
  metering-service/    — Usage metering & rate limiting
  notification-service/— In-app & email notifications
  scheduler-service/   — Cron & delayed job scheduling
  search-service/      — Typesense full-text search
  audit-service/       — Immutable audit log
  platform-service/    — Tenant & policy management
  dashboard-service/   — Analytics dashboard API
  datasource-service/  — External data source integration
  template-service/    — Workflow template management
  replication-service/ — Cross-region data replication
packages/              — 28 shared libraries (db, auth, rbac, events, cache, etc.)
connectors/            — 11 marketplace connector integrations
infrastructure/        — Terraform, Helm, K8s, Docker Compose
templates/             — Workflow & dashboard templates
```

## Quick Start

```bash
pnpm install
pnpm run build
pnpm --filter @longox/web run dev       # Frontend (localhost:3001)
pnpm --filter @longox/api-gateway run dev # API gateway (localhost:3000)
```

## Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run lint` — lint all packages
- `pnpm --filter <name> run dev` — run a specific service in dev mode

## Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Frontend           | Next.js 15, React 19, Tailwind CSS 4    |
| UI                 | shadcn/ui (Radix), Framer Motion        |
| State              | TanStack React Query, Zustand           |
| API                | Express 5 (Node.js), TypeScript         |
| Database           | PostgreSQL + Drizzle ORM                |
| Queues             | Redis + BullMQ                          |
| Validation         | Zod                                     |
| AI                 | OpenAI, Groq, Mistral                   |
| Auth               | JWT, bcrypt, SSO (Google, Microsoft, Okta/OIDC) |
| Search             | Typesense                               |
| Observability      | OpenTelemetry, Pino                     |
| Infrastructure     | Kubernetes, Docker, Terraform           |
| Connectors         | 11 integrations incl. Stripe, Slack, Notion, Salesforce |

## Services

Each service in `services/` is independently deployable as a Docker container. The `api-gateway` routes external requests to the appropriate internal service.

## Billing Plans

| Plan    | Price    | Executions | Workflows | AI Tokens  |
|---------|----------|------------|-----------|------------|
| Starter | Free     | 500/mo     | 10        | 50K        |
| Growth  | $79/mo   | 15K/mo     | 100       | 500K       |
| Business| $299/mo  | 100K/mo    | Unlimited | 5M         |

## License

MIT

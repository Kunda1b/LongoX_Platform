---
name: Connector Framework Architecture
description: Production connector manifest pattern — DB schema, seeding, API routes, and frontend integration for the FlowCraft connector registry.
---

## Connector manifest pattern

The connector framework adds 4 new tables to `lib/db/src/schema/connectors.ts`:

- `connector_actions` — per-connector actions with JSON Schema for input/output
- `connector_triggers` — per-connector triggers (webhook or polling) with config and pollingInterval
- `connector_executions` — observability/audit log for each execution
- `connector_polling_states` — cursor tracking for polling triggers per tenant

The main `connectorsTable` was extended with: `displayName`, `version`, `sdkVersion`, `authType`, `authConfig` (JSONB), `certificationLevel`, `permissions` (JSONB array), `capabilities` (JSONB bool map), `rateLimit` (JSONB), `healthStatus` (JSONB).

## Seeding approach

A `seeded` module-level boolean guard prevents duplicate seeding on each request. The seed checks `connectorActionsTable` for existing rows before running. If empty, it deletes all connectors and re-seeds all 15 with full manifests. Called lazily from `GET /connectors/categories` route.

**Why:** PostgreSQL sequences do not reset on DELETE, so re-seeded rows get higher IDs (e.g. 11–25 instead of 1–15). Frontends must never assume specific IDs — always use IDs returned by the API.

## Route ordering (critical)

In `artifacts/api-server/src/routes/connectors.ts`, register:

1. `GET /connectors/categories` (seed trigger)
2. `GET /connectors` (list with filters)
3. `GET /connectors/executions` ← MUST be before `/:id`
4. `GET /connectors/:id/actions`
5. `GET /connectors/:id/triggers`
6. `GET /connectors/:id`
7. `POST /connectors/:id/install`
8. `POST /connectors/:id/uninstall`

**Why:** Express matches routes in registration order; `/executions` would be caught as `/:id = "executions"` if placed after the `/:id` handler.

## Frontend integration

For the new sub-resource endpoints (actions, triggers, executions), use direct `useQuery` with `fetch`:

```tsx
const { data: actions = [] } = useQuery<ConnectorAction[]>({
  queryKey: ["connectorActions", connector.id],
  queryFn: () =>
    fetch(`/api/connectors/${connector.id}/actions`).then((r) => r.json()),
});
```

This avoids manually adding typed hooks to the generated `api-client-react` files.

## certificationLevel filter

The `GET /connectors` route supports a `certificationLevel` query param as a custom filter (not in the Zod schema, read directly from `req.query`). Works with `eq(connectorsTable.certificationLevel, q.certificationLevel)` condition.

## FlowCraft UI

- Certification level tabs: All / Official / Verified / Community / Deprecated
- Connector card: colored avatar, cert badge (gold/blue/gray), auth badge, health dot, action/trigger counts
- Detail dialog uses Dialog + nested Tabs (Overview / Actions / Triggers / Health)
- Dialog fetches actions/triggers/executions on open

## AutoFlow UI

- Expand-in-place card (no dialog) with collapsible actions and triggers sections
- Sidebar has Certification + Category filters
- Stats bar shows aggregate counts across all connectors

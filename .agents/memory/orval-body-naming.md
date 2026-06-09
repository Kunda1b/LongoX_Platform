---
name: Orval operationId body naming conflict
description: Orval names requestBody Zod schemas after the operationId; conflicts with types/ directory when the spec schema has the same name.
---

## Rule
When adding a requestBody to an endpoint in the OpenAPI spec, do NOT use a `$ref` to a schema that has the same name orval would derive for the body (`<OperationId>Body`).

## Why
Orval generates two artefacts for a named requestBody schema:
1. A Zod schema in `lib/api-zod/src/generated/api.ts` named `<OperationId>Body`
2. A TypeScript interface in `lib/api-zod/src/generated/types/<operationId>Body.ts`

Both are re-exported from `lib/api-zod/src/index.ts` via `export *`, causing TS2308 "already exported a member" error.

## How to apply
- For endpoints where body content is minimal (e.g. `publishWorkflow` with an optional `changeNote`): **omit the requestBody entirely** from the spec. Read `req.body?.field` in the route handler without spec validation.
- For endpoints where the body is a `$ref` to a schema with a *different* name from `<OperationId>Body` (e.g. `createDashboard` with `$ref: DashboardInput`, body schema becomes `CreateDashboardBody`): no conflict, proceed normally.
- Affected pattern: any `POST /foo/{id}/bar` where operationId is `barFoo` and you add a `$ref: "#/components/schemas/BarFooBody"`.

## History
- First hit with `triggerWebhook` endpoint (webhook body conflict, per existing memory note).
- Second hit with `publishWorkflow` endpoint — even switching to inline schema didn't help because orval still names the generated type `PublishWorkflowBody`. Only omitting requestBody entirely resolved it.

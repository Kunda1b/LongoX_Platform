---
name: Orval webhook requestBody conflict
description: Adding a requestBody to a webhook-style POST endpoint in OpenAPI causes duplicate type export in orval-generated code.
---

## Rule
Do NOT add a `requestBody` to webhook trigger endpoints in openapi.yaml when using orval for codegen.

**Why:** Orval generates `TriggerWebhookBody` in both `generated/api.ts` (Zod schema) and `generated/types/triggerWebhookBody.ts` (TS type). Both are re-exported from `lib/api-zod/src/index.ts` via `export * from "./generated/api"` and `export * from "./generated/types"`, causing TS2308 ambiguous re-export.

**How to apply:** For webhook endpoints that pass through arbitrary payloads, omit the requestBody from the OpenAPI spec and read `req.body` directly in the route handler.

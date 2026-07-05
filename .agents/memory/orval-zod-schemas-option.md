---
name: Orval zod config — avoid schemas option
description: Using schemas+mode:split in the orval zod output config causes TS2308 duplicate-export errors; the fix is mode:single with an absolute target path.
---

## Rule

Never use `schemas: { path: "generated/types", type: "typescript" }` in the orval zod output config.

**Why:** With `mode: "split"` + `schemas`, orval generates:

1. `generated/api.ts` — Zod schemas (e.g. `ExecuteDataSourceQueryBody`)
2. `generated/types/` — TS type files with the same names
3. `src/index.ts` — auto-regenerated on every codegen run to re-export BOTH paths

This causes `TS2308: Module "./generated/api" has already exported member 'X'` because the same name appears in both `api.ts` and `types/`. Since orval regenerates `index.ts` on every run, manual fixes to the index are overwritten.

**How to apply:** For the orval `zod` config, use:

```ts
output: {
  client: "zod",
  target: path.resolve(apiZodSrc, "generated", "api.ts"),  // absolute path
  mode: "single",
  clean: true,
  // NO workspace, NO schemas option
}
```

With `mode: "single"` and no `workspace`, orval does NOT generate an `index.ts` — the one in `packages/api-zod/src/index.ts` is hand-maintained as `export * from "./generated/api";`.

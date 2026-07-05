---
name: pnpm packageManager field on Replit
description: Do not set the `packageManager` field in package.json when deploying to Replit — it triggers a corepack bootstrap that crashes with SIGABRT/pthread exhaustion.
---

# pnpm packageManager field on Replit

**Rule:** Remove the `packageManager` field from the root `package.json`. Replit ships pnpm@10.x natively. Declaring any specific version (even `pnpm@9.x`) triggers Replit's corepack-like bootstrap which runs `pnpm add pnpm@<version> --allow-build=@pnpm/exe`, and `@pnpm/exe` fails to compile because of thread resource exhaustion (`pthread_create: Resource temporarily unavailable` → `SIGABRT`).

**Why:** Replit's internal package-installation wrapper intercepts pnpm invocations, sees the `packageManager` field, and attempts to pin the exact version. The native Rust binary (`@pnpm/exe`) cannot be compiled in the container.

**How to apply:**

- Delete `"packageManager": "pnpm@X.Y.Z"` from `package.json`.
- Remove the `allowBuilds` map from `pnpm-workspace.yaml` (pnpm v11-only syntax); move those packages into `onlyBuiltDependencies` instead.
- After removing the field, run `pnpm install --no-frozen-lockfile` once from bash to populate `node_modules`.
- Replit will then use its system pnpm (v10.26.1 as of 2026-06-16) without any bootstrapping attempt.

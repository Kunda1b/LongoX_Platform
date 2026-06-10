# Test Plan — PR #1 (Phase 1: LongoX rename + baseline + apps/web build)

## What changed (user-visible)

- The platform is rebranded **FlowCraft/AutoFlow → LongoX**.
- `apps/web` (Next.js) now builds and runs for the first time (it never built on `main`).
- `/` now redirects to `/login` (the colliding `(auth)/page.tsx` placeholder was removed; `app/page.tsx` is canonical).

## Environment

- Running locally: `apps/web` via `pnpm run start` (production build) at `http://localhost:3000`.
- No backend/API is wired in this phase, so authenticated data calls (`/api/*`) will fail — expected and out of scope.

## Code grounding (evidence)

- `apps/web/src/app/(auth)/login/page.tsx:43` → `<CardTitle>LongoX</CardTitle>`
- `apps/web/src/components/app-sidebar.tsx:78` → `<span ...>LongoX</span>`
- `apps/web/src/app/page.tsx` → `redirect("/login")`
- `apps/web/src/lib/auth.tsx` → reads `localStorage["auth"] = {token,user}` on mount (used to seed the dashboard-shell check); API base = `NEXT_PUBLIC_API_URL ?? "/api"`.

---

## Test 1 — App serves and `/` redirects to `/login` (proves build fix)

Steps:

1. Navigate to `http://localhost:3000/`.

Pass/fail:

- PASS if the browser URL becomes `http://localhost:3000/login` and a rendered page (not a 500/blank/Next error overlay) is shown.
- FAIL if the page 500s, shows the Next.js error overlay, or stays on `/` with no content.
- Adversarial note: if the build were still broken (Pages/App-Router conflict or the `/` route collision), this would error instead of cleanly redirecting.

## Test 2 — Login page shows the **LongoX** brand (proves the rename)

Steps:

1. On `/login`, read the card title heading and the form.

Pass/fail:

- PASS if the title reads exactly **"LongoX"**, AND the form shows an Email field, a Password field, and a "Sign in" button.
- FAIL if the title reads "FlowCraft"/"AutoFlow", or the form does not render.
- Adversarial note: a broken/incomplete rename would render "FlowCraft" here — this is the single most discriminating check for the rename.

## Test 3 (secondary) — Dashboard shell renders under LongoX brand

Setup (no UI login path exists without a backend, so seed auth directly):

1. In the browser console run:
   `localStorage.setItem('auth', JSON.stringify({token:'test',user:{id:1,email:'demo@longox.io',name:'Demo',tenantId:1,role:'admin'}}))`
2. Navigate to `http://localhost:3000/dashboard`.

Pass/fail:

- PASS if the dashboard layout renders with the left sidebar showing **"LongoX"** and navigation items (Workflows, Executions, etc.), i.e. `AuthGuard` did not bounce back to `/login`.
- FAIL if it redirects to `/login` (seed not honored) or the shell fails to render.
- Expected/known: data widgets may show loading/empty/error states because no backend `/api` is running — this is acceptable and noted, not a failure of this PR.

---

## Out of scope (later phases)

- Actual login/auth against a backend, workflow execution, service functionality. These depend on services not wired in Phase 1.

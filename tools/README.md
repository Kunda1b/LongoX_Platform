# LongoX Platform — `tools/`

This directory hosts **CLI utilities and developer tools** that aren't
shipped as part of any service or library package. Typical residents:

- **One-off scripts** — data backfills, schema migrations, smoke tests.
- **Codegen harnesses** — SDL → TypeScript, OpenAPI → client SDKs.
- **Local dev tools** — seeders, fixture generators, tunnel helpers.
- **Repo automation** — release-note composers, changelog formatters,
  architecture-compliance linters.

## Layout conventions

```
tools/
  <tool-name>/        # one folder per tool
    README.md         # what it does + how to run it
    package.json      # if it has deps, otherwise a plain shell script
    src/...
```

## Usage

Most tools are runnable via `pnpm` workspace scripts or `tsx`:

```bash
pnpm --filter @longox/<tool-name> start
# or, for ad-hoc scripts:
pnpm tsx tools/<tool-name>/src/main.ts
```

## Scope (matrix item 23)

This directory was created as part of the architecture-compliance sweep
(matrix item 23). It is intentionally empty of tools today; residents will
land here as the platform grows.

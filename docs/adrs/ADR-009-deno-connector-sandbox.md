# ADR-009: Deno Isolates for Connector Sandbox Runtime

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Ecosystem Team Lead, AI Platform Lead, Security Lead
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

Connector actions and AI tool calls execute untrusted code requiring a sandbox with resource caps.

## Decision

Use Deno isolates (V8 isolates running the Deno runtime) for connector sandboxing. Current implementation uses Node.js `vm` module with Deno-compat polyfills as an interim step; migration to `deno_core` is planned.

## Consequences

- Positive: strong V8 isolate isolation, sub-ms cold-start
- Negative: requires migration from vm-based to deno_core-based runtime
- Neutral: connector SDK targets Deno-compatible APIs

## References

architecture.md Section 26.10, packages/connector-sandbox/

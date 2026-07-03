# ADR-011: Workflow Diffs — JSON Patch Storage + Semantic UI Overlay

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Workflow Team Lead, Frontend Lead, Platform Architecture
- **Supersedes**: n/a (complements ADR-005)
- **Superseded by**: n/a

## Context

JSON Patch operations are path-based and confusing in code-review UI. Workflow authors need human-friendly diff display.

## Decision

Keep JSON Patch as storage format (per ADR-005). Add a semantic diff renderer in the workflow builder UI.

## Consequences

- Positive: best of both worlds — standard storage + friendly UI
- Negative: additional frontend code to maintain
- Neutral: decouples storage from presentation

## References

architecture.md Section 26.12, packages/workflow-canvas/src/diff.ts

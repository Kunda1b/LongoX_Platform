# ADR-008: Server-Sent Events (SSE) for Realtime Updates

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Frontend Lead, Backend Lead, Platform Architecture
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

User-facing surfaces need realtime updates for execution monitoring, dashboard refresh, and notifications.

## Decision

Use SSE for all realtime updates with multiplexed event streams over a single connection.

## Consequences

- Positive: simpler than WebSocket, works through corporate proxies
- Negative: unidirectional — bidirectional needs separate WebSocket
- Neutral: limits future bidirectional use cases

## References

architecture.md Section 26.9

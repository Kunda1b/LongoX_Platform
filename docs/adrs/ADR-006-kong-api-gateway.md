# ADR-006: Kong as API Gateway

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Platform Architecture Team, Backend Lead, SRE Lead
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

The API gateway sits in front of every backend service and is on the critical path for every request.

## Decision

Use Kong Gateway (OSS or Enterprise) as the API gateway with declarative configuration and DB-less mode.

## Consequences

- Positive: batteries-included auth/rate-limit/logging middleware
- Negative: Kong adds a stateful dependency when not in DB-less mode
- Neutral: ties us to Kong's plugin API

## Alternatives Considered

- Envoy: rejected due to configuration complexity
- AWS API Gateway: rejected due to cloud lock-in
- NGINX Plus: rejected due to licensing

## References

architecture.md Section 12, Section 26.7

# ADR-012: Workflow Run History Retention — 13M Hot + 7Y Cold, Tenant-Configurable

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Platform Architecture, Security/Compliance Lead, SRE Lead, Finance Lead
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

Workflow executions, audit logs, and metering events must be retained for compliance (SOC 2, HIPAA, GDPR).

## Decision

Default retention is 13 months hot + 7 years cold. Enterprise tenants can extend hot retention to 24 or 36 months.

## Consequences

- Positive: meets compliance baseline by default
- Negative: hot retention extension increases storage cost
- Neutral: tenant-configurable retention adds setting to tenant_settings

## References

architecture.md Section 26.13, services/execution-service/src/application/services/

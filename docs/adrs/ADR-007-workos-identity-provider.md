# ADR-007: WorkOS as Identity Provider

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Platform Architecture Team, Identity Team Lead, Security Lead
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

The platform needs enterprise SSO, SCIM directory sync, MFA, and an admin portal for IT admins.

## Decision

Use WorkOS as the primary identity provider with platform remaining the session authority.

## Consequences

- Positive: enterprise SSO ready out of the box
- Negative: vendor dependency for critical-path service
- Neutral: Tier 3 customers federate via SAML/OIDC

## References

architecture.md Section 26.8

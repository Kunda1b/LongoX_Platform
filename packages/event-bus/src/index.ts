/**
 * @longox/event-bus — public façade over @longox/shared-events.
 *
 * The package name "event-bus" is the consumer-facing alias historically
 * imported by services. The real implementation lives in
 * `@longox/shared-events` (Redis Streams + consumer-offset bookkeeping per
 * ADR-007 / §19). This barrel re-exports the canonical surface so service
 * code that imports from `@longox/event-bus` resolves to the same module
 * graph as direct `@longox/shared-events` consumers.
 *
 * (matrix item 44 — eliminate placeholder; re-export real surface.)
 */
export * from "@longox/shared-events";

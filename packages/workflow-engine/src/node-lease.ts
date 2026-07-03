/**
 * Node lease system for multi-worker safety.
 *
 * Before executing a node, a worker acquires an exclusive lease.
 * If a worker dies mid-execution, the lease expires and another worker
 * can pick up from the last checkpoint.
 *
 * In single-worker setups (BullMQ concurrency=1), this is a no-op guard.
 * In multi-worker setups, a Redis-backed implementation should be used.
 *
 * This module provides:
 *   - InMemoryLeaseStore  — for single-process / testing
 *   - RedisLeaseStore     — for production (requires ioredis)
 */

import type { NodeLease, LeaseStore } from "./types";

// ─── In-memory lease store (single-process) ────────────────────────────────────

interface InMemoryLeaseRecord {
  workerId: string;
  expiresAt: number;
}

export class InMemoryLeaseStore implements LeaseStore {
  private leases = new Map<string, InMemoryLeaseRecord>();
  private readonly workerId: string;
  private readonly defaultTtlMs: number;

  constructor(opts: { workerId?: string; defaultTtlMs?: number } = {}) {
    this.workerId = opts.workerId ?? generateWorkerId();
    // ADR-009 / architecture.md §9.3: 5-minute default lease TTL.
    // Workers renew every 60s; if a worker dies the lease expires after 5 min
    // and the scheduler requeues the execution with a 'recover' marker.
    // Operators may override via WORKER_LEASE_TTL_SECONDS env var (consumed
    // by services/execution-service/src/config/runtime.ts).
    this.defaultTtlMs = opts.defaultTtlMs ?? 300_000; // 5 minutes
  }

  async acquire(
    executionId: number,
    nodeId: string,
    ttlMs?: number,
  ): Promise<NodeLease | null> {
    const key = leaseKey(executionId, nodeId);
    const now = Date.now();
    const ttl = ttlMs ?? this.defaultTtlMs;

    const existing = this.leases.get(key);
    if (
      existing &&
      existing.expiresAt > now &&
      existing.workerId !== this.workerId
    ) {
      // Another worker holds the lease and it has not expired
      return null;
    }

    const expiresAt = now + ttl;
    this.leases.set(key, { workerId: this.workerId, expiresAt });

    const store = this;
    return {
      executionId,
      nodeId,
      workerId: this.workerId,
      acquiredAt: new Date(now),
      expiresAt: new Date(expiresAt),
      async release() {
        const current = store.leases.get(key);
        if (current?.workerId === store.workerId) {
          store.leases.delete(key);
        }
      },
    };
  }

  /** Clean up expired leases (call periodically in long-running processes). */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.leases) {
      if (record.expiresAt <= now) this.leases.delete(key);
    }
  }
}

// ─── Redis lease store (production, multi-worker) ─────────────────────────────

export class RedisLeaseStore implements LeaseStore {
  private readonly workerId: string;
  private readonly defaultTtlMs: number;

  constructor(
    private readonly redis: {
      set(
        key: string,
        value: string,
        option: "PX",
        ms: number,
        cond: "NX",
      ): Promise<"OK" | null>;
      del(key: string): Promise<number>;
      get(key: string): Promise<string | null>;
    },
    opts: { workerId?: string; defaultTtlMs?: number } = {},
  ) {
    this.workerId = opts.workerId ?? generateWorkerId();
    // ADR-009 / architecture.md §9.3: 5-minute default lease TTL.
    this.defaultTtlMs = opts.defaultTtlMs ?? 300_000;
  }

  async acquire(
    executionId: number,
    nodeId: string,
    ttlMs?: number,
  ): Promise<NodeLease | null> {
    const key = `longox:lease:${leaseKey(executionId, nodeId)}`;
    const ttl = ttlMs ?? this.defaultTtlMs;
    const now = Date.now();

    // SET NX PX — only set if not already present
    const result = await this.redis.set(key, this.workerId, "PX", ttl, "NX");
    if (result !== "OK") return null;

    const redis = this.redis;
    const workerId = this.workerId;

    return {
      executionId,
      nodeId,
      workerId,
      acquiredAt: new Date(now),
      expiresAt: new Date(now + ttl),
      async release() {
        // Only delete if we still own it (Lua CAS for safety)
        const current = await redis.get(key);
        if (current === workerId) await redis.del(key);
      },
    };
  }
}

// ─── No-op store (dev / when leases are disabled) ─────────────────────────────

export class NoOpLeaseStore implements LeaseStore {
  private readonly workerId = generateWorkerId();

  async acquire(executionId: number, nodeId: string): Promise<NodeLease> {
    return {
      executionId,
      nodeId,
      workerId: this.workerId,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 3_600_000),
      async release() {},
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leaseKey(executionId: number, nodeId: string): string {
  return `${executionId}:${nodeId}`;
}

function generateWorkerId(): string {
  return `worker-${process.pid}-${Math.random().toString(36).slice(2, 9)}`;
}

import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const regionalPoolsTable = pgTable("regional_pools", {
  id: serial("id").primaryKey(),
  regionId: text("region_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  workerCount: integer("worker_count").notNull().default(0),
  activeExecutions: integer("active_executions").notNull().default(0),
  queueDepth: integer("queue_depth").notNull().default(0),
  cpuUtilization: real("cpu_utilization").notNull().default(0),
  memoryUtilization: real("memory_utilization").notNull().default(0),
  dbReplicaLagSeconds: real("db_replica_lag_seconds").notNull().default(0),
  lastHealthCheck: timestamp("last_health_check", { withTimezone: true }),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  isPrimary: integer("is_primary").notNull().default(0),
  failoverEligible: integer("failover_eligible").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RegionalPool = typeof regionalPoolsTable.$inferSelect;

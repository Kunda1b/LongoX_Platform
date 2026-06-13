import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { trace, metrics, SpanStatusCode } from "@opentelemetry/api";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with monitoring
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX ?? "20", 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT ?? "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT ?? "5000", 10),
});

// Pool metrics
const meter = metrics.getMeter("shared-db");
const poolActiveGauge = meter.createGauge("db.pool.active", {
  description: "Number of active database connections",
});
const poolIdleGauge = meter.createGauge("db.pool.idle", {
  description: "Number of idle database connections",
});
const poolWaitingGauge = meter.createGauge("db.pool.waiting", {
  description: "Number of waiting database connections",
});

// Update pool metrics periodically
setInterval(() => {
  poolActiveGauge.record(pool.totalCount - pool.idleCount);
  poolIdleGauge.record(pool.idleCount);
  poolWaitingGauge.record(pool.waitingCount);
}, 10000);

// Log pool events
pool.on("connect", () => {
  console.log("[DB] New client connected to pool");
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
});

// Slow query threshold (in milliseconds)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD ?? "100", 10);

// Original query method wrapper for slow query logging
const originalQuery = pool.query.bind(pool);
pool.query = async function wrappedQuery(text: string | pg.QueryConfig, values?: any[]) {
  const start = Date.now();
  const tracer = trace.getTracer("shared-db");
  
  return tracer.startActiveSpan("db.query", async (span) => {
    try {
      const result = await originalQuery(text, values);
      const duration = Date.now() - start;
      
      span.setAttribute("db.system", "postgresql");
      span.setAttribute("db.duration_ms", duration);
      span.setAttribute("db.rows_affected", result.rowCount ?? 0);
      
      if (typeof text === "string") {
        span.setAttribute("db.statement", text.substring(0, 200));
      }
      
      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(
          `[DB] Slow query detected (${duration}ms):`,
          typeof text === "string" ? text.substring(0, 100) : "complex query"
        );
        span.setAttribute("db.slow", true);
      }
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
};

export const db = drizzle(pool, { schema });

export * from "./schema";

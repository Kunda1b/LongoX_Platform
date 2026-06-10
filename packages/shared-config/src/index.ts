export interface ServiceConfig {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  redisUrl: string;
  apiPrefix: string;
  corsOrigins: string[];
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

function envArray(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadConfig(): ServiceConfig {
  return {
    port: envNumber("PORT", 3001),
    host: envString("HOST", "0.0.0.0"),
    nodeEnv: envString("NODE_ENV", "development"),
    logLevel: envString("LOG_LEVEL", "info"),
    databaseUrl: envString("DATABASE_URL", "postgres://localhost:5432/longox"),
    jwtSecret: envString("JWT_SECRET", "change-me-in-production"),
    jwtExpiry: envString("JWT_EXPIRY", "24h"),
    redisUrl: envString("REDIS_URL", "redis://localhost:6379"),
    apiPrefix: envString("API_PREFIX", "/api/v1"),
    corsOrigins: envArray("CORS_ORIGINS", ["http://localhost:5173"]),
  };
}

let cachedConfig: ServiceConfig | null = null;

export function getConfig(): ServiceConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

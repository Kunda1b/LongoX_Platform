/**
 * @longox/db — database package entrypoint.
 *
 * Per ADR-013 Phase 3, Drizzle has been fully removed. This module
 * re-exports the Prisma client singleton from `./prisma/index.ts`.
 *
 * Services should import directly from `@longox/db/prisma` for the
 * Prisma client. This root export exists for backward compatibility
 * with any code that imports from `@longox/db` directly.
 */

export { prisma, PrismaClient } from "./prisma/index.js";
export type { PrismaClient as PrismaClientType } from "./prisma/index.js";
export { default } from "./prisma/index.js";

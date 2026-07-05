import { PrismaClient } from "../generated/prisma/index.js";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`[Prisma] ${signal} received, disconnecting...`);
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("[Prisma] disconnect error:", err);
  } finally {
    process.exit(0);
  }
}
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
export default prisma;
export { PrismaClient };
export type { PrismaClient as PrismaClientType };

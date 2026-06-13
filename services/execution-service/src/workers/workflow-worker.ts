import { logger } from "@longox/shared-logger";
import { jobQueue } from "../queue/bullmq-queue";

export class WorkflowWorker {
  private running = false;

  constructor(_pollIntervalMs: number = 1000) {
    // BullMQ handles polling internally via its worker
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info("[Worker] Starting BullMQ worker...");
    await jobQueue.start();
    logger.info("[Worker] BullMQ worker ready");
  }

  async stop(): Promise<void> {
    this.running = false;
    await jobQueue.stop();
    logger.info("[Worker] BullMQ worker stopped");
  }
}

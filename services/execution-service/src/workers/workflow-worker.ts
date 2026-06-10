import { logger } from "@longox/shared-logger";
import { jobQueue } from "../queue/job-queue";

export class WorkflowWorker {
  private running = false;
  private pollIntervalMs: number;

  constructor(pollIntervalMs: number = 1000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info("[Worker] Workflow worker started");

    await jobQueue.start();

    while (this.running) {
      await this.processNext();
      await this.sleep(this.pollIntervalMs);
    }
  }

  stop(): void {
    this.running = false;
    logger.info("[Worker] Workflow worker stopped");
  }

  private async processNext(): Promise<void> {
    if (jobQueue.getQueueLength() === 0 || jobQueue.getActiveWorkers() >= 5) {
      return;
    }
    logger.debug(
      {
        queueLength: jobQueue.getQueueLength(),
        activeWorkers: jobQueue.getActiveWorkers(),
      },
      "[Worker] Queue status",
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

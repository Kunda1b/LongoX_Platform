import { EventEmitter } from "node:events";
import { logger } from "@longox/shared-logger";

export interface ExecutionEventPayload {
  executionId: string;
  eventType: string;
  data: Record<string, unknown>;
}

const REDIS_CHANNEL = "longox:execution-events";

interface RedisClient {
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, listener: (message: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}

let redisClient: RedisClient | null = null;

export function setRedisClient(client: RedisClient | null): void {
  redisClient = client;
}

const localBus = new EventEmitter();
localBus.setMaxListeners(1000);

let subscribed = false;

async function ensureSubscribed(): Promise<void> {
  if (!redisClient || subscribed) return;
  subscribed = true;
  await redisClient.subscribe(REDIS_CHANNEL, (message: string) => {
    try {
      const payload = JSON.parse(message) as ExecutionEventPayload;
      localBus.emit("execution-event", payload);
    } catch {
      logger.warn({ message }, "[RedisBus] Failed to parse inbound event");
    }
  });
}

async function publishToRedis(payload: ExecutionEventPayload): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.publish(REDIS_CHANNEL, JSON.stringify(payload));
  } catch (err) {
    logger.error({ err }, "[RedisBus] Failed to publish event to Redis");
  }
}

export const sseExecutionBus = {
  onExecutionEvent: (
    executionId: string,
    handler: (payload: ExecutionEventPayload) => void,
  ): (() => void) => {
    const wrapped = (payload: ExecutionEventPayload) => {
      if (payload.executionId === executionId) {
        handler(payload);
      }
    };
    localBus.on("execution-event", wrapped);
    return () => {
      localBus.off("execution-event", wrapped);
    };
  },

  broadcast: async (payload: ExecutionEventPayload): Promise<void> => {
    localBus.emit("execution-event", payload);
    await publishToRedis(payload);
  },

  removeAllListeners: (): void => {
    localBus.removeAllListeners("execution-event");
  },
};

void ensureSubscribed();

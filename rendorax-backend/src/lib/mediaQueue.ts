import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

export const MEDIA_TRANSCODE_QUEUE_NAME = "media-transcode";

export interface MediaTranscodeJobPayload {
  jobId: string;
  assetId: string;
  userId: string;
  objectKey: string;
}

/**
 * Parse REDIS_URL into BullMQ/ioredis connection options.
 * Preserves TLS for `rediss:` (e.g. Upstash); never logs the URL.
 * Exported for verification only — do not print credentials.
 */
export function parseRedisUrl(redisUrl: string): RedisOptions {
  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error(
      "REDIS_URL is not a valid Redis connection URL (expected redis:// or rediss://)",
    );
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "redis:" && protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL protocol must be redis:// or rediss://",
    );
  }

  const options: RedisOptions = {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
  };

  if (protocol === "rediss:") {
    options.tls = {};
  }

  return options;
}

/** Worker connections — retry indefinitely (BullMQ requirement). */
export function getBullMqWorkerConnection(): RedisOptions {
  return {
    ...parseRedisUrl(process.env.REDIS_URL || "redis://localhost:6379"),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

/** @deprecated Use getBullMqWorkerConnection — kept for worker import stability. */
export function getBullMqConnection() {
  return getBullMqWorkerConnection();
}

/**
 * Producer (HTTP) connections — fail fast when Redis is down so enqueue does not hang.
 * @see https://docs.bullmq.io/guide/connections
 */
export function getBullMqProducerConnection(): RedisOptions {
  return {
    ...parseRedisUrl(process.env.REDIS_URL || "redis://localhost:6379"),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    enableReadyCheck: false,
  };
}

export const mediaTranscodeQueue = new Queue(MEDIA_TRANSCODE_QUEUE_NAME, {
  connection: getBullMqProducerConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30_000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

mediaTranscodeQueue.on("error", (error) => {
  const message =
    error instanceof Error ? error.message : "Unknown queue connection error";
  console.error("[mediaTranscodeQueue] Redis/BullMQ error:", message);
});

export function isMediaQueueEnabled(): boolean {
  return process.env.MEDIA_QUEUE_ENABLED !== "false";
}

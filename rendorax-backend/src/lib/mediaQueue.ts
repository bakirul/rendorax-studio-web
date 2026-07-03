import { Queue } from "bullmq";

export const MEDIA_TRANSCODE_QUEUE_NAME = "media-transcode";

export interface MediaTranscodeJobPayload {
  jobId: string;
  assetId: string;
  userId: string;
  objectKey: string;
}

function parseRedisUrl(redisUrl: string) {
  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
  };
}

/** Worker connections — retry indefinitely (BullMQ requirement). */
export function getBullMqWorkerConnection() {
  return {
    ...parseRedisUrl(process.env.REDIS_URL || "redis://localhost:6379"),
    maxRetriesPerRequest: null,
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
export function getBullMqProducerConnection() {
  return {
    ...parseRedisUrl(process.env.REDIS_URL || "redis://localhost:6379"),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
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

export function isMediaQueueEnabled(): boolean {
  return process.env.MEDIA_QUEUE_ENABLED !== "false";
}

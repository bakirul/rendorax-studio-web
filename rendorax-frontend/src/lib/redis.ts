// src/lib/redis.ts
import { Redis } from "ioredis";

// Ensure environment variable is set (e.g., Upstash Redis URL or Localhost)
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const createRedisClient = () => {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
};

// We need distinct clients for Publishing and Subscribing in Redis
export const redisPubClient = createRedisClient();
export const redisSubClient = createRedisClient();
export const redisClient = createRedisClient(); // General purpose client (caching, etc.)

redisClient.on("error", (err) => console.error("[Redis] Client Error:", err));
redisPubClient.on("error", (err) => console.error("[Redis Pub] Error:", err));
redisSubClient.on("error", (err) => console.error("[Redis Sub] Error:", err));
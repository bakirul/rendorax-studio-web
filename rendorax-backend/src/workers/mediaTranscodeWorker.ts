import type { PrismaClient } from "@prisma/client";
import { Worker } from "bullmq";
import {
  getBullMqConnection,
  MEDIA_TRANSCODE_QUEUE_NAME,
  type MediaTranscodeJobPayload,
} from "../lib/mediaQueue";
import { runMediaTranscodeJob } from "../lib/runMediaTranscodeJob";

export function startMediaTranscodeWorker(
  prisma: PrismaClient,
): Worker | null {
  if (process.env.MEDIA_WORKER_ENABLED === "false") {
    console.log("[mediaTranscodeWorker] Worker disabled via MEDIA_WORKER_ENABLED=false");
    return null;
  }

  const worker = new Worker(
    MEDIA_TRANSCODE_QUEUE_NAME,
    async (job) => {
      const data = job.data as MediaTranscodeJobPayload;
      await runMediaTranscodeJob(prisma, data);
    },
    {
      connection: getBullMqConnection(),
      concurrency: Number(process.env.MEDIA_WORKER_CONCURRENCY ?? 1),
      lockDuration: Number(process.env.MEDIA_WORKER_LOCK_MS ?? 6 * 60 * 60 * 1000),
      maxStalledCount: 2,
    },
  );

  worker.on("ready", () => {
    console.log("[mediaTranscodeWorker] FFmpeg transcode worker ready (Phase 4)");
  });

  worker.on("error", (error) => {
    const message =
      error instanceof Error ? error.message : "Unknown worker connection error";
    console.error("[mediaTranscodeWorker] Redis/BullMQ error:", message);
  });

  worker.on("completed", (job) => {
    const data = job.data as MediaTranscodeJobPayload;
    console.log("[mediaTranscodeWorker] Job completed:", {
      bullJobId: job.id,
      jobId: data.jobId,
      assetId: data.assetId,
    });
  });

  worker.on("failed", (job, error) => {
    console.error("[mediaTranscodeWorker] Job failed:", {
      bullJobId: job?.id,
      jobId: (job?.data as MediaTranscodeJobPayload | undefined)?.jobId,
      error,
    });
  });

  return worker;
}

import type { MediaProcessingJob, PrismaClient } from "@prisma/client";
import {
  isMediaQueueEnabled,
  mediaTranscodeQueue,
  type MediaTranscodeJobPayload,
} from "./mediaQueue";

const ACTIVE_JOB_STATUSES = [
  "queued",
  "probing",
  "transcoding",
  "uploading",
] as const;

export interface EnqueueMediaTranscodeInput {
  assetId: string;
  userId: string;
  mimeType: string;
  objectKey: string;
}

export async function enqueueMediaTranscodeJob(
  prisma: PrismaClient,
  input: EnqueueMediaTranscodeInput,
): Promise<MediaProcessingJob | null> {
  if (!input.mimeType.startsWith("video/")) {
    return null;
  }

  const existing = await prisma.mediaProcessingJob.findFirst({
    where: {
      assetId: input.assetId,
      status: { in: [...ACTIVE_JOB_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    console.log("[mediaProcessing] Active transcode job already exists:", {
      assetId: input.assetId,
      jobId: existing.id,
      status: existing.status,
    });
    return existing;
  }

  const job = await prisma.mediaProcessingJob.create({
    data: {
      assetId: input.assetId,
      status: "queued",
    },
  });

  if (!isMediaQueueEnabled()) {
    console.log("[mediaProcessing] Queue disabled — job recorded only:", job.id);
    return job;
  }

  const payload: MediaTranscodeJobPayload = {
    jobId: job.id,
    assetId: input.assetId,
    userId: input.userId,
    objectKey: input.objectKey,
  };

  const enqueueTimeoutMs = Number(process.env.MEDIA_ENQUEUE_TIMEOUT_MS ?? 5_000);

  await Promise.race([
    mediaTranscodeQueue.add("transcode", payload, {
      jobId: job.id,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Redis enqueue timed out after ${enqueueTimeoutMs}ms`)),
        enqueueTimeoutMs,
      );
    }),
  ]);

  console.log("[mediaProcessing] Enqueued transcode job:", {
    jobId: job.id,
    assetId: input.assetId,
    objectKey: input.objectKey,
  });

  return job;
}

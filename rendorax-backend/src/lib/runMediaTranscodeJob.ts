import type { PrismaClient } from "@prisma/client";
import {
  buildHlsMasterObjectKey,
  buildHlsProxyRoot,
  buildWebProxyMp4ObjectKey,
} from "./mediaProxyKeys";
import type { MediaTranscodeJobPayload } from "./mediaQueue";
import { buildPublicUrl } from "./r2";
import {
  uploadLocalDirectoryToR2,
  uploadR2File,
} from "./r2Upload";
import {
  buildMasterPlaylist,
  createTranscodeTempDir,
  ensureMinimumRenditions,
  probeVideo,
  removeTranscodeTempDir,
  selectHlsRenditions,
  transcodeHlsRendition,
  transcodeWebProxyMp4,
  type HlsRenditionPlan,
} from "./mediaFfmpeg";
import fs from "fs/promises";
import path from "path";

async function updateJobProgress(
  prisma: PrismaClient,
  jobId: string,
  progress: number,
  status?: "probing" | "transcoding" | "uploading" | "ready" | "failed",
): Promise<void> {
  await prisma.mediaProcessingJob.update({
    where: { id: jobId },
    data: {
      progress: Math.max(0, Math.min(100, Math.round(progress))),
      ...(status ? { status } : {}),
    },
  });
}

async function markJobFailed(
  prisma: PrismaClient,
  jobId: string,
  assetId: string,
  error: unknown,
): Promise<void> {
  const message =
    error instanceof Error ? error.message : "Media transcode failed";

  await prisma.$transaction([
    prisma.mediaProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorCode: "TRANSCODE_FAILED",
        errorMessage: message.slice(0, 4000),
        completedAt: new Date(),
        attempts: { increment: 1 },
      },
    }),
    prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        processingStatus: "failed",
      },
    }),
  ]);
}

export async function runMediaTranscodeJob(
  prisma: PrismaClient,
  payload: MediaTranscodeJobPayload,
): Promise<void> {
  const { jobId, assetId, objectKey } = payload;
  const sourceUrl = buildPublicUrl(objectKey);
  let tempDir: string | null = null;

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new Error(`Media asset not found: ${assetId}`);
  }

  const proxyVersion = asset.proxyVersion ?? 1;
  const hlsRootKey = buildHlsProxyRoot(assetId, proxyVersion);
  const hlsMasterKey = buildHlsMasterObjectKey(assetId, proxyVersion);
  const webProxyKey = buildWebProxyMp4ObjectKey(assetId, proxyVersion);

  try {
    await prisma.$transaction([
      prisma.mediaProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "probing",
          startedAt: new Date(),
          workerId: process.env.HOSTNAME ?? "media-worker",
          attempts: { increment: 1 },
        },
      }),
      prisma.mediaAsset.update({
        where: { id: assetId },
        data: { processingStatus: "probing" },
      }),
    ]);

    await updateJobProgress(prisma, jobId, 5, "probing");

    const probe = await probeVideo(sourceUrl);
    tempDir = await createTranscodeTempDir();

    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        durationMs: probe.durationMs,
        width: probe.width,
        height: probe.height,
        frameRate: probe.frameRate,
        processingStatus: "transcoding",
      },
    });

    await updateJobProgress(prisma, jobId, 10, "transcoding");

    const mp4LocalPath = path.join(tempDir, "proxy-720p.mp4");
    await transcodeWebProxyMp4(sourceUrl, mp4LocalPath);
    await updateJobProgress(prisma, jobId, 35, "transcoding");

    const renditions = ensureMinimumRenditions(
      probe.height,
      selectHlsRenditions(probe.width, probe.height),
    );

    const hlsLocalRoot = path.join(tempDir, "hls");
    await fs.mkdir(hlsLocalRoot, { recursive: true });

    const totalRenditions = renditions.length;
    for (let index = 0; index < totalRenditions; index += 1) {
      const rendition = renditions[index];
      const renditionDir = path.join(hlsLocalRoot, rendition.name);
      await transcodeHlsRendition(sourceUrl, renditionDir, rendition);

      const renditionProgress = 35 + ((index + 1) / totalRenditions) * 40;
      await updateJobProgress(prisma, jobId, renditionProgress, "transcoding");
    }

    const masterPlaylist = buildMasterPlaylist(renditions);
    await fs.writeFile(path.join(hlsLocalRoot, "master.m3u8"), masterPlaylist, "utf8");
    await updateJobProgress(prisma, jobId, 80, "uploading");

    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: { processingStatus: "uploading" },
    });

    await uploadR2File(webProxyKey, mp4LocalPath, "video/mp4");
    await updateJobProgress(prisma, jobId, 85, "uploading");

    const uploadedSegments = await uploadLocalDirectoryToR2(hlsLocalRoot, hlsRootKey);
    if (uploadedSegments === 0) {
      throw new Error("HLS upload produced zero objects");
    }

    await updateJobProgress(prisma, jobId, 95, "uploading");

    await prisma.$transaction([
      prisma.mediaProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "ready",
          progress: 100,
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      }),
      prisma.mediaAsset.update({
        where: { id: assetId },
        data: {
          playbackObjectKey: hlsMasterKey,
          playbackFormat: "hls",
          processingStatus: "ready",
        },
      }),
    ]);

    console.log("[mediaTranscode] Completed:", {
      jobId,
      assetId,
      hlsMasterKey,
      webProxyKey,
      renditions: renditions.map((item: HlsRenditionPlan) => item.name),
      uploadedSegments,
      sourceUrl,
    });
  } catch (error) {
    console.error("[mediaTranscode] Failed:", { jobId, assetId, objectKey, error });
    await markJobFailed(prisma, jobId, assetId, error);
    throw error;
  } finally {
    if (tempDir) {
      await removeTranscodeTempDir(tempDir);
    }
  }
}

import fs from "fs/promises";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import type { HlsRendition } from "./mediaProxyKeys";
import { HLS_RENDITIONS } from "./mediaProxyKeys";

export interface VideoProbeResult {
  durationMs: number;
  width: number;
  height: number;
  frameRate: number;
  videoCodec: string | null;
  audioCodec: string | null;
}

export interface HlsRenditionPlan {
  name: HlsRendition;
  height: number;
  width: number;
  bandwidth: number;
  videoBitrate: string;
  maxrate: string;
  bufsize: string;
}

const RENDITION_LADDER: Omit<HlsRenditionPlan, "width">[] = [
  {
    name: "1080p",
    height: 1080,
    bandwidth: 5_500_000,
    videoBitrate: "5000k",
    maxrate: "5500k",
    bufsize: "11000k",
  },
  {
    name: "720p",
    height: 720,
    bandwidth: 2_800_000,
    videoBitrate: "2800k",
    maxrate: "3000k",
    bufsize: "6000k",
  },
  {
    name: "540p",
    height: 540,
    bandwidth: 1_500_000,
    videoBitrate: "1400k",
    maxrate: "1600k",
    bufsize: "3200k",
  },
  {
    name: "360p",
    height: 360,
    bandwidth: 800_000,
    videoBitrate: "750k",
    maxrate: "900k",
    bufsize: "1800k",
  },
];

function parseFrameRate(raw: string | undefined): number {
  if (!raw) return 24;
  if (raw.includes("/")) {
    const [num, den] = raw.split("/").map(Number);
    if (den > 0 && Number.isFinite(num)) {
      return num / den;
    }
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

export function probeVideo(sourceUrl: string): Promise<VideoProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(sourceUrl, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      const videoStream = metadata.streams?.find(
        (stream) => stream.codec_type === "video",
      );
      const audioStream = metadata.streams?.find(
        (stream) => stream.codec_type === "audio",
      );

      if (!videoStream?.width || !videoStream.height) {
        reject(new Error("No video stream found in source file"));
        return;
      }

      const durationSeconds = Number(metadata.format?.duration ?? 0);
      resolve({
        durationMs: Math.max(
          0,
          Math.round((Number.isFinite(durationSeconds) ? durationSeconds : 0) * 1000),
        ),
        width: videoStream.width,
        height: videoStream.height,
        frameRate: parseFrameRate(videoStream.r_frame_rate),
        videoCodec: videoStream.codec_name ?? null,
        audioCodec: audioStream?.codec_name ?? null,
      });
    });
  });
}

export function selectHlsRenditions(
  sourceWidth: number,
  sourceHeight: number,
): HlsRenditionPlan[] {
  const aspectRatio = sourceWidth / sourceHeight;

  return RENDITION_LADDER.filter(
    (rendition) => rendition.height <= sourceHeight + 16,
  ).map((rendition) => ({
    ...rendition,
    width: evenDimension(Math.round(rendition.height * aspectRatio)),
  }));
}

export function transcodeWebProxyMp4(
  sourceUrl: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(sourceUrl)
      .inputOptions(["-probesize", "50M", "-analyzeduration", "50M"])
      .outputOptions([
        "-preset",
        "veryfast",
        "-vf",
        "scale=-2:720",
        "-c:v",
        "libx264",
        "-profile:v",
        "main",
        "-pix_fmt",
        "yuv420p",
        "-b:v",
        "2800k",
        "-maxrate",
        "3000k",
        "-bufsize",
        "6000k",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (error) => reject(error))
      .run();
  });
}

export function transcodeHlsRendition(
  sourceUrl: string,
  outputDir: string,
  rendition: HlsRenditionPlan,
): Promise<void> {
  return fs.mkdir(outputDir, { recursive: true }).then(
    () =>
      new Promise<void>((resolve, reject) => {
        ffmpeg(sourceUrl)
          .inputOptions(["-probesize", "50M", "-analyzeduration", "50M"])
          .outputOptions([
            "-preset",
            "veryfast",
            "-vf",
            `scale=-2:${rendition.height}`,
            "-c:v",
            "libx264",
            "-profile:v",
            "main",
            "-pix_fmt",
            "yuv420p",
            "-b:v",
            rendition.videoBitrate,
            "-maxrate",
            rendition.maxrate,
            "-bufsize",
            rendition.bufsize,
            "-c:a",
            "aac",
            "-b:a",
            rendition.height >= 720 ? "128k" : "96k",
            "-ac",
            "2",
            "-hls_time",
            "4",
            "-hls_playlist_type",
            "vod",
            "-hls_flags",
            "independent_segments",
            "-hls_segment_type",
            "mpegts",
            "-hls_segment_filename",
            path.join(outputDir, "seg_%05d.ts"),
            "-f",
            "hls",
          ])
          .output(path.join(outputDir, "index.m3u8"))
          .on("end", () => resolve())
          .on("error", (error) => reject(error))
          .run();
      }),
  );
}

export function buildMasterPlaylist(renditions: HlsRenditionPlan[]): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (const rendition of renditions) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${rendition.bandwidth},RESOLUTION=${rendition.width}x${rendition.height},CODECS="avc1.4d401f,mp4a.40.2"`,
    );
    lines.push(`${rendition.name}/index.m3u8`);
  }

  return `${lines.join("\n")}\n`;
}

export async function createTranscodeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "rendorax-transcode-"));
}

export async function removeTranscodeTempDir(tempDir: string): Promise<void> {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
}

export function ensureMinimumRenditions(
  sourceHeight: number,
  renditions: HlsRenditionPlan[],
): HlsRenditionPlan[] {
  if (renditions.length > 0) {
    return renditions;
  }

  const aspectRatio = 16 / 9;
  const height = Math.min(sourceHeight, 720);
  return [
    {
      name: "720p",
      height,
      width: evenDimension(Math.round(height * aspectRatio)),
      bandwidth: 2_800_000,
      videoBitrate: "2800k",
      maxrate: "3000k",
      bufsize: "6000k",
    },
  ];
}

export { HLS_RENDITIONS };

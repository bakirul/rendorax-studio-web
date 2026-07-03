const DEFAULT_SEEK_SECONDS = 0.5;
const DEFAULT_MAX_BYTES = 50 * 1024;
const MAX_DIMENSION = 640;

export interface GenerateVideoThumbnailOptions {
  seekSeconds?: number;
  maxBytes?: number;
  maxDimension?: number;
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

async function canvasToBlobUnderBudget(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob | null> {
  const formats = ["image/webp", "image/jpeg"] as const;

  for (const type of formats) {
    let quality = 0.88;
    while (quality >= 0.35) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, quality),
      );
      if (blob && blob.size <= maxBytes) {
        return blob;
      }
      quality -= 0.08;
    }
  }

  return null;
}

/**
 * Captures a single frame from a local video File using a hidden <video> + Canvas.
 * Returns a lightweight poster blob (<50KB by default). Never touches the network.
 */
export async function generateVideoThumbnail(
  file: File,
  options: GenerateVideoThumbnailOptions = {},
): Promise<Blob | null> {
  if (!isVideoFile(file)) return null;

  const seekSeconds = options.seekSeconds ?? DEFAULT_SEEK_SECONDS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };

    const fail = () => finish(null);

    video.addEventListener("error", fail);

    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : seekSeconds;
      const safeSeek = Math.min(
        Math.max(seekSeconds, 0),
        Math.max(duration - 0.05, 0),
      );
      video.currentTime = safeSeek;
    });

    video.addEventListener("seeked", () => {
      void (async () => {
        try {
          let width = video.videoWidth;
          let height = video.videoHeight;
          if (!width || !height) {
            fail();
            return;
          }

          const scale = Math.min(1, maxDimension / Math.max(width, height));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            fail();
            return;
          }

          ctx.drawImage(video, 0, 0, width, height);
          const blob = await canvasToBlobUnderBudget(canvas, maxBytes);
          finish(blob);
        } catch {
          fail();
        }
      })();
    });

    video.src = objectUrl;
  });
}

export function isVideoUpload(file: File): boolean {
  return isVideoFile(file);
}

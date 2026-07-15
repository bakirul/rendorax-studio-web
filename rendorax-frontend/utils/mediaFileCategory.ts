export type MediaFileCategory = "video" | "audio" | "document" | "image" | "unknown";

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|mxf|mkv|avi)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|flac|opus)$/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
const IFRAME_DOC_EXTENSIONS = /\.(pdf|txt)$/i;
const GOOGLE_DOC_EXTENSIONS = /\.(docx?|xlsx?|pptx?)$/i;

function extractFileName(fileNameOrUrl: string): string {
  const withoutQuery = fileNameOrUrl.split("?")[0] ?? fileNameOrUrl;
  const segments = withoutQuery.split("/");
  return segments[segments.length - 1] ?? fileNameOrUrl;
}

/** Extension-based media category for preview UI routing. */
export function getMediaFileCategory(fileNameOrUrl: string): MediaFileCategory {
  const name = extractFileName(fileNameOrUrl).toLowerCase();

  if (VIDEO_EXTENSIONS.test(name)) return "video";
  if (AUDIO_EXTENSIONS.test(name)) return "audio";
  if (IMAGE_EXTENSIONS.test(name)) return "image";
  if (IFRAME_DOC_EXTENSIONS.test(name) || GOOGLE_DOC_EXTENSIONS.test(name)) {
    return "document";
  }

  return "unknown";
}

/** Whether the dashboard player pipeline can preview this file type. */
export function isMediaFilePreviewable(fileNameOrUrl: string): boolean {
  return getMediaFileCategory(fileNameOrUrl) !== "unknown";
}

/** Resolves iframe `src` for document previews, or null when unsupported. */
export function getDocumentPreviewSrc(
  playbackUrl: string,
  fileNameOrUrl: string,
): string | null {
  const name = extractFileName(fileNameOrUrl).toLowerCase();

  if (IFRAME_DOC_EXTENSIONS.test(name)) {
    return playbackUrl;
  }

  if (GOOGLE_DOC_EXTENSIONS.test(name)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(playbackUrl)}&embedded=true`;
  }

  return null;
}

export function getMediaCategoryGridIcon(category: MediaFileCategory): string {
  switch (category) {
    case "audio":
      return "🎵";
    case "document":
      return "📄";
    case "image":
      return "🖼️";
    default:
      return "📁";
  }
}

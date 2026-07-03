const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|mxf|mkv|avi)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i;

export function isTranscribableMedia(
  fileName: string,
  mimeType?: string | null,
): boolean {
  if (mimeType?.startsWith("video/") || mimeType?.startsWith("audio/")) {
    return true;
  }
  return VIDEO_EXTENSIONS.test(fileName) || AUDIO_EXTENSIONS.test(fileName);
}

export function inferMimeTypeFromFileName(fileName: string): string | undefined {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".mxf": "application/mxf",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
  };
  return map[ext];
}

export function srtFileNameForAsset(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot === -1 ? fileName : fileName.slice(0, dot);
  return `${base}.srt`;
}

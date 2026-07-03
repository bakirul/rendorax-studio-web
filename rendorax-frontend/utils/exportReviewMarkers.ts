import { getCommentDisplayName, type VideoCommentRow } from "@/utils/commentAuthor";
import { formatSMPTE } from "@/utils/timecode";

const DEFAULT_FPS = 24;

export interface MarkerExportRow {
  timecode: string;
  seconds: number;
  author: string;
  comment: string;
  fileName: string;
  createdAt: string;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Strip vault user prefix for human-readable asset names in exports. */
export function cleanExportFileName(fileName: string): string {
  const idx = fileName.indexOf("_");
  return idx >= 0 ? fileName.substring(idx + 1) : fileName;
}

export function buildMarkerRows(
  comments: VideoCommentRow[],
  fileName: string,
  fps = DEFAULT_FPS,
): MarkerExportRow[] {
  const displayFileName = cleanExportFileName(fileName);

  return [...comments]
    .sort((a, b) => a.time_stamp - b.time_stamp)
    .map((comment) => ({
      timecode: formatSMPTE(comment.time_stamp, fps),
      seconds: comment.time_stamp,
      author: getCommentDisplayName(comment),
      comment: comment.comment_text,
      fileName: displayFileName,
      createdAt: comment.created_at ?? "",
    }));
}

export function buildMarkersCsv(rows: MarkerExportRow[]): string {
  const header = "Timecode,Seconds,Author,Comment,FileName,CreatedAt";
  const lines = rows.map((row) =>
    [
      escapeCsvField(row.timecode),
      String(row.seconds),
      escapeCsvField(row.author),
      escapeCsvField(row.comment),
      escapeCsvField(row.fileName),
      escapeCsvField(row.createdAt),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export function buildMarkersJson(rows: MarkerExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

function sanitizeAssetSegment(fileName: string): string {
  const cleaned = cleanExportFileName(fileName);
  const safe = cleaned.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_|_$/g, "");
  return safe || "asset";
}

export function buildMarkersFilename(
  fileName: string,
  ext: "csv" | "json",
): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `Rendorax_Markers_${sanitizeAssetSegment(fileName)}_${stamp}.${ext}`;
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

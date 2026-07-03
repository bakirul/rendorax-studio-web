/**
 * Converts SRT subtitle content to WebVTT format for HTML5 <track> elements.
 */
export function convertSrtToVtt(srt: string): string {
  const normalized = srt.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "WEBVTT\n\n";
  }

  const vttBody = normalized
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines.length < 2) return block;

      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeLineIndex === -1) return block;

      const updatedLines = [...lines];
      updatedLines[timeLineIndex] = updatedLines[timeLineIndex].replace(/,/g, ".");

      // Drop numeric cue index line if present (SRT block number).
      if (/^\d+$/.test(updatedLines[0]?.trim() ?? "")) {
        updatedLines.shift();
      }

      return updatedLines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return `WEBVTT\n\n${vttBody}\n`;
}

export function createVttBlobUrl(srt: string): string {
  const vtt = convertSrtToVtt(srt);
  const blob = new Blob([vtt], { type: "text/vtt;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export function revokeVttBlobUrl(vttUrl: string | null | undefined): void {
  if (!vttUrl?.startsWith("blob:")) return;
  URL.revokeObjectURL(vttUrl);
}

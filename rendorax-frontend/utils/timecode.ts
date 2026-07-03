// utils/timecode.ts

/**
 * Converts standard seconds (from HTML5 Video Player) into SMPTE Timecode (HH:MM:SS:FF)
 * Supports true frame-accurate calculation for standard broadcast frame rates.
 */
export function formatSMPTE(currentTimeInSeconds: number, fps: number): string {
  // Calculate total frames strictly based on the provided FPS
  const totalFrames = Math.floor(currentTimeInSeconds * fps);

  // Extract individual components
  const frames = totalFrames % fps;
  const seconds = Math.floor(currentTimeInSeconds) % 60;
  const minutes = Math.floor(currentTimeInSeconds / 60) % 60;
  const hours = Math.floor(currentTimeInSeconds / 3600);

  // Helper function to pad single digits with a leading zero
  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Converts a SMPTE Timecode (HH:MM:SS:FF) back to seconds.
 * Useful when clicking a timestamped comment to seek the video player.
 */
export function smpteToSeconds(timecode: string, fps: number): number {
  const parts = timecode.split(":");
  if (parts.length !== 4) return 0;

  const [hours, minutes, seconds, frames] = parts.map(Number);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds + frames / fps;
  return totalSeconds;
}

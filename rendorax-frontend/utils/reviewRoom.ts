/**
 * Stable Socket.io room IDs for OTS timeline share, join-video-room,
 * comment broadcast, and video sync. Prefer assetId when available.
 */

export type ReviewRoomPreviewFile = {
  name?: string;
  assetId?: string;
} | null | undefined;

const PREFIX_ASSET = "review:asset:";
const PREFIX_FILE = "review:file:";
const PREFIX_FOLDER = "review:folder:";

/** Strip vault user prefix so editor and viewer resolve the same file key. */
export function normalizeReviewFileKey(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "unknown";
  const idx = trimmed.indexOf("_");
  const cleaned = idx >= 0 ? trimmed.substring(idx + 1).trim() : trimmed;
  return cleaned || trimmed;
}

/**
 * Single room key for editor + viewers on the same asset/review context.
 * Order: assetId → normalized file name → folder → global lobby.
 */
export function getReviewRoomId(
  previewFile?: ReviewRoomPreviewFile,
  currentFolder?: string | null,
): string {
  const assetId = previewFile?.assetId?.trim();
  if (assetId) {
    return `${PREFIX_ASSET}${assetId}`;
  }

  const name = previewFile?.name?.trim();
  if (name) {
    return `${PREFIX_FILE}${normalizeReviewFileKey(name)}`;
  }

  const folder = currentFolder?.trim();
  if (folder) {
    return `${PREFIX_FOLDER}${folder}`;
  }

  return "global-lobby";
}

export type JoinVideoRoomPayload = {
  room: string;
  userId?: string;
  role?: string;
};

/** Idempotent join for the active review room (call before share emit). */
export function emitJoinReviewRoom(
  socket: { emit: (event: string, ...args: unknown[]) => void },
  roomId: string,
  meta?: { userId?: string; role?: string },
): void {
  const payload: JoinVideoRoomPayload = {
    room: roomId,
    ...(meta?.userId ? { userId: meta.userId } : {}),
    ...(meta?.role ? { role: meta.role } : {}),
  };
  socket.emit("join-video-room", payload);
}

export function emitLeaveReviewRoom(
  socket: { emit: (event: string, ...args: unknown[]) => void },
  roomId: string,
): void {
  socket.emit("leave-video-room", { room: roomId });
}

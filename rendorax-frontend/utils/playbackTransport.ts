/**
 * Phase 1 review playback transport helpers.
 * Program audio stays local; Socket.IO syncs transport only.
 */

export const PLAYBACK_DRIFT_TOLERANCE_SEC = 0.4;
export const LATE_JOIN_TIMEOUT_MS = 4000;

export type PlaybackAuthRole = "admin" | "editor" | "client" | "unknown";

export type PlaybackTransportPayload = {
  room: string;
  assetId?: string;
  currentTime: number;
  paused?: boolean;
  playbackRate?: number;
  seq: number;
  sentAt: number;
};

export type PlaybackStatePayload = PlaybackTransportPayload & {
  paused: boolean;
};

export function getAuthPlaybackRole(user: {
  app_metadata?: { role?: string };
} | null | undefined): PlaybackAuthRole {
  const role = user?.app_metadata?.role;
  if (role === "admin" || role === "editor" || role === "client") {
    return role;
  }
  return "unknown";
}

export function isHostCapableRole(role: PlaybackAuthRole | string | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function buildTransportPayload(args: {
  room: string;
  assetId?: string | null;
  currentTime: number;
  paused?: boolean;
  playbackRate?: number;
  seq: number;
}): PlaybackTransportPayload {
  const assetId = args.assetId?.trim() || undefined;
  return {
    room: args.room,
    ...(assetId ? { assetId } : {}),
    currentTime: Number.isFinite(args.currentTime) ? args.currentTime : 0,
    ...(typeof args.paused === "boolean" ? { paused: args.paused } : {}),
    ...(typeof args.playbackRate === "number" && Number.isFinite(args.playbackRate)
      ? { playbackRate: args.playbackRate }
      : {}),
    seq: args.seq,
    sentAt: Date.now(),
  };
}

/** Accept only strictly increasing seq for a given room/asset session. */
export function shouldAcceptRemoteSeq(
  lastAppliedSeq: number,
  incomingSeq: number,
): boolean {
  if (!Number.isFinite(incomingSeq)) return false;
  return incomingSeq > lastAppliedSeq;
}

export function isTransportContextMatch(args: {
  payloadRoom: string;
  activeRoom: string | null;
  payloadAssetId?: string;
  activeAssetId?: string | null;
}): boolean {
  if (!args.activeRoom || args.payloadRoom !== args.activeRoom) {
    return false;
  }
  const activeAsset = args.activeAssetId?.trim() || "";
  const payloadAsset = args.payloadAssetId?.trim() || "";
  if (activeAsset && payloadAsset && activeAsset !== payloadAsset) {
    return false;
  }
  return true;
}

export type ApplyRemoteResult = "played" | "paused" | "autoplay-blocked";

/**
 * Apply remote transport to a local video element.
 * Caller must set isApplyingRemoteRef around this call.
 */
export async function applyRemotePlayback(
  video: HTMLVideoElement,
  state: {
    currentTime: number;
    paused: boolean;
    playbackRate?: number;
  },
  options?: { driftTolerance?: number; forceSeek?: boolean },
): Promise<ApplyRemoteResult> {
  const driftTolerance = options?.driftTolerance ?? PLAYBACK_DRIFT_TOLERANCE_SEC;
  const forceSeek = options?.forceSeek ?? false;

  if (
    typeof state.playbackRate === "number" &&
    Number.isFinite(state.playbackRate) &&
    state.playbackRate > 0
  ) {
    video.playbackRate = state.playbackRate;
  }

  const drift = Math.abs(video.currentTime - state.currentTime);
  if (forceSeek || drift > driftTolerance) {
    if (Number.isFinite(state.currentTime) && state.currentTime >= 0) {
      video.currentTime = state.currentTime;
    }
  }

  if (state.paused) {
    video.pause();
    return "paused";
  }

  try {
    await video.play();
    return "played";
  } catch {
    video.pause();
    return "autoplay-blocked";
  }
}

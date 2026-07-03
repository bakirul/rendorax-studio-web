import type { MediaAssetRecord } from "@/utils/mediaAssets";
import { isMediaAssetProcessing } from "@/utils/mediaAssets";

/** Canonical display keys — extend here when backend adds finer stages. */
export type MediaStatusKey =
  | "uploading"
  | "upload_complete"
  | "upload_failed"
  | "queued"
  | "extracting_metadata"
  | "processing"
  | "generating_proxy"
  | "generating_hls"
  | "uploading_derivatives"
  | "generating_waveform"
  | "ready"
  | "processing_failed";

export type MediaStatusTone = "neutral" | "active" | "success" | "error";

export interface MediaDisplayStatus {
  key: MediaStatusKey;
  label: string;
  tone: MediaStatusTone;
  showProgress: boolean;
  progress: number | null;
  isTerminal: boolean;
}

/** Ephemeral client-side upload session (browser → R2). */
export type ClientUploadPhase =
  | "uploading"
  | "finalizing"
  | "complete"
  | "processing"
  | "failed";

export interface ClientUploadSession {
  fileName: string;
  progress: number;
  phase: ClientUploadPhase;
  errorMessage?: string;
  savedAsset?: Pick<MediaAssetRecord, "processingStatus" | "id" | "fileName"> | null;
}

export const UPLOAD_SUCCESS_VISIBLE_MS = 1750;

/**
 * Optional hints for future job-stage granularity (proxy, HLS, waveform).
 * Phase 1 does not populate these; mapper falls back to processingStatus.
 */
export interface AssetProcessingHints {
  stage?: "proxy" | "hls" | "waveform";
  progress?: number | null;
}

const PROCESSING_STATUS_MAP: Record<
  NonNullable<MediaAssetRecord["processingStatus"]>,
  MediaDisplayStatus
> = {
  queued: {
    key: "queued",
    label: "Queued",
    tone: "active",
    showProgress: false,
    progress: null,
    isTerminal: false,
  },
  probing: {
    key: "extracting_metadata",
    label: "Extracting Metadata",
    tone: "active",
    showProgress: false,
    progress: null,
    isTerminal: false,
  },
  transcoding: {
    key: "processing",
    label: "Processing",
    tone: "active",
    showProgress: false,
    progress: null,
    isTerminal: false,
  },
  uploading: {
    key: "uploading_derivatives",
    label: "Uploading Derivatives",
    tone: "active",
    showProgress: false,
    progress: null,
    isTerminal: false,
  },
  ready: {
    key: "ready",
    label: "Ready",
    tone: "success",
    showProgress: false,
    progress: null,
    isTerminal: true,
  },
  failed: {
    key: "processing_failed",
    label: "Processing Failed",
    tone: "error",
    showProgress: false,
    progress: null,
    isTerminal: true,
  },
};

const STAGE_HINT_MAP: Record<
  NonNullable<AssetProcessingHints["stage"]>,
  Pick<MediaDisplayStatus, "key" | "label">
> = {
  proxy: { key: "generating_proxy", label: "Generating Proxy" },
  hls: { key: "generating_hls", label: "Generating HLS" },
  waveform: { key: "generating_waveform", label: "Generating Waveform" },
};

export function resolveUploadDisplayStatus(
  session: ClientUploadSession,
): MediaDisplayStatus {
  if (session.phase === "failed") {
    return {
      key: "upload_failed",
      label: "Failed",
      tone: "error",
      showProgress: false,
      progress: null,
      isTerminal: true,
    };
  }

  if (session.phase === "processing" && session.savedAsset) {
    const processing = resolveAssetDisplayStatus(session.savedAsset);
    if (processing) return processing;
  }

  if (session.phase === "complete") {
    return {
      key: "upload_complete",
      label: "Upload Complete",
      tone: "success",
      showProgress: false,
      progress: null,
      isTerminal: true,
    };
  }

  if (
    session.phase === "finalizing" ||
    (session.phase === "uploading" && session.progress >= 100)
  ) {
    return {
      key: "uploading",
      label: "Finalizing...",
      tone: "active",
      showProgress: false,
      progress: null,
      isTerminal: false,
    };
  }

  return {
    key: "uploading",
    label: "Uploading",
    tone: "active",
    showProgress: true,
    progress: session.progress,
    isTerminal: false,
  };
}

export function hasActiveAssetProcessing(
  asset?: Pick<MediaAssetRecord, "processingStatus"> | null,
): boolean {
  return Boolean(asset && resolveAssetDisplayStatus(asset));
}

export function resolveAssetDisplayStatus(
  asset: {
    processingStatus?: MediaAssetRecord["processingStatus"];
  },
  hints?: AssetProcessingHints,
): MediaDisplayStatus | null {
  const status = asset.processingStatus;
  if (!status) return null;

  const base = PROCESSING_STATUS_MAP[status];
  if (!base || base.key === "ready") return null;

  if (status === "transcoding" && hints?.stage) {
    const stage = STAGE_HINT_MAP[hints.stage];
    return {
      ...base,
      key: stage.key,
      label: stage.label,
      showProgress: hints.progress != null,
      progress: hints.progress ?? null,
    };
  }

  if (hints?.progress != null && isMediaAssetProcessing(asset)) {
    return {
      ...base,
      showProgress: true,
      progress: hints.progress,
    };
  }

  return base;
}

/** Upload session first; then server processing if exposed on the asset. */
export function resolveCombinedDisplayStatus(
  asset: { processingStatus?: MediaAssetRecord["processingStatus"] } | null,
  uploadSession?: ClientUploadSession | null,
  hints?: AssetProcessingHints,
): MediaDisplayStatus | null {
  if (uploadSession?.phase === "uploading" || uploadSession?.phase === "finalizing") {
    return resolveUploadDisplayStatus(uploadSession);
  }

  if (uploadSession?.phase === "failed") {
    return resolveUploadDisplayStatus(uploadSession);
  }

  if (uploadSession?.phase === "processing") {
    return resolveUploadDisplayStatus(uploadSession);
  }

  const processing = asset ? resolveAssetDisplayStatus(asset, hints) : null;
  if (processing) return processing;

  if (uploadSession?.phase === "complete") {
    return resolveUploadDisplayStatus(uploadSession);
  }

  return null;
}

export function shouldPollAssetsForProcessing(
  assets: Array<{ processingStatus?: MediaAssetRecord["processingStatus"] }>,
): boolean {
  return assets.some((asset) => isMediaAssetProcessing(asset));
}

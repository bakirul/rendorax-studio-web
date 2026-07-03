import { saveAs } from "file-saver";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import { normalizeLanguageKey, getLanguageLabel } from "@/utils/languageCodes";
import { srtFileNameForAsset } from "@/utils/mediaTypes";
import { createVttBlobUrl } from "@/utils/srtToVtt";
import type { VideoSubtitleTrack } from "@/store/useDashboardStore";
import { getSelectableAssetPreviewKey } from "@/utils/previewAssetKey";
import { getBackendAuthHeaders } from "@/utils/backendAuth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface TranscribeResponse {
  success: boolean;
  assetId: string;
  srt: string;
  language: string;
}

function resolveFileUrl(asset: GallerySelectableAsset): string {
  if (asset.source === "cloud") {
    return asset.publicUrl ?? "";
  }
  return asset.vaultDownloadUrl ?? "";
}

export async function requestAssetTranscription(
  asset: GallerySelectableAsset,
  language: string,
): Promise<TranscribeResponse> {
  const fileUrl = resolveFileUrl(asset);
  if (!fileUrl) {
    throw new Error("Missing file URL for transcription");
  }

  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/media/transcribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assetId: asset.id,
      fileUrl,
      language: normalizeLanguageKey(language),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `Transcription failed (${res.status})`,
    );
  }

  return res.json();
}

export function downloadSrtFile(srtContent: string, fileName: string): void {
  const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
  saveAs(blob, srtFileNameForAsset(fileName));
}

export async function generateAndDownloadSrt(
  asset: GallerySelectableAsset,
  language: string,
): Promise<void> {
  const result = await requestAssetTranscription(asset, language);
  downloadSrtFile(result.srt, asset.fileName);
}

export interface GeneratedSubtitleResult {
  srt: string;
  language: string;
  label: string;
  vttUrl: string;
  assetKey: string;
  track: VideoSubtitleTrack;
}

export async function generateSubtitlesForPlayer(
  asset: GallerySelectableAsset,
  language: string,
): Promise<GeneratedSubtitleResult> {
  const result = await requestAssetTranscription(asset, language);
  const normalizedLanguage = normalizeLanguageKey(result.language || language);
  const vttUrl = createVttBlobUrl(result.srt);
  const assetKey = getSelectableAssetPreviewKey(asset);

  const track: VideoSubtitleTrack = {
    language: normalizedLanguage,
    label: getLanguageLabel(normalizedLanguage),
    vttUrl,
  };

  return {
    srt: result.srt,
    language: normalizedLanguage,
    label: track.label,
    vttUrl,
    assetKey,
    track,
  };
}

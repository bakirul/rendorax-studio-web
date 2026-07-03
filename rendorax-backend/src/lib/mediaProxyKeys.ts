import path from "path";
import { randomUUID } from "crypto";

/** Supported HLS rendition rungs for the Frame.io-style proxy ladder. */
export const HLS_RENDITIONS = ["1080p", "720p", "540p", "360p"] as const;
export type HlsRendition = (typeof HLS_RENDITIONS)[number];

function normalizeAssetId(assetId: string): string {
  const normalized = assetId.replace(/^\/+/, "").trim();
  if (!normalized) {
    throw new Error("assetId is required");
  }
  return normalized;
}

function versionSegment(proxyVersion: number): string {
  return proxyVersion > 1 ? `/v${proxyVersion}` : "";
}

/**
 * Optional user-scoped mezzanine layout for new uploads:
 * uploads/{userId}/{assetId}/{fileName}
 */
export function buildUserScopedUploadObjectKey(
  userId: string,
  assetId: string,
  fileName: string,
): string {
  const sanitizedName = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const normalizedUserId = userId.replace(/^\/+/, "").trim();
  const normalizedAssetId = normalizeAssetId(assetId);
  return `uploads/${normalizedUserId}/${normalizedAssetId}/${sanitizedName}`;
}

/** Legacy-compatible upload key (unchanged default for existing clients). */
export function buildLegacyUploadObjectKey(fileName: string): string {
  const sanitizedName = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return `uploads/${randomUUID()}-${sanitizedName}`;
}

export function buildHlsProxyRoot(
  assetId: string,
  proxyVersion = 1,
): string {
  const id = normalizeAssetId(assetId);
  return `proxies/hls/${id}${versionSegment(proxyVersion)}`;
}

export function buildHlsMasterObjectKey(
  assetId: string,
  proxyVersion = 1,
): string {
  return `${buildHlsProxyRoot(assetId, proxyVersion)}/master.m3u8`;
}

export function buildHlsRenditionPrefix(
  assetId: string,
  rendition: HlsRendition,
  proxyVersion = 1,
): string {
  return `${buildHlsProxyRoot(assetId, proxyVersion)}/${rendition}`;
}

export function buildHlsRenditionPlaylistObjectKey(
  assetId: string,
  rendition: HlsRendition,
  proxyVersion = 1,
): string {
  return `${buildHlsRenditionPrefix(assetId, rendition, proxyVersion)}/index.m3u8`;
}

export function buildWebProxyMp4ObjectKey(
  assetId: string,
  proxyVersion = 1,
): string {
  const id = normalizeAssetId(assetId);
  return `proxies/mp4/${id}${versionSegment(proxyVersion)}.mp4`;
}

export function buildPreviewMp4ObjectKey(assetId: string): string {
  return `proxies/previews/${normalizeAssetId(assetId)}/preview.mp4`;
}

export function buildWaveformObjectKey(assetId: string): string {
  return `proxies/waveforms/${normalizeAssetId(assetId)}.json`;
}

export function buildProxyPosterObjectKey(assetId: string): string {
  return `thumbnails/${normalizeAssetId(assetId)}/poster.webp`;
}

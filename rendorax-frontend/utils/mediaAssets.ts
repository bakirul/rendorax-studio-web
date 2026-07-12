import { getBackendAuthHeaders } from "@/utils/backendAuth";
import { BACKEND_URL, backendFetch } from "@/utils/backendFetch";

export interface MediaAssetRecord {
  id: string;
  fileName: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  objectKey?: string | null;
  mimeType: string;
  fileSize: number | null;
  folder: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  frameRate?: number | null;
  playbackObjectKey?: string | null;
  playbackFormat?: "hls" | "progressive" | "none" | null;
  processingStatus?:
    | "queued"
    | "probing"
    | "transcoding"
    | "uploading"
    | "ready"
    | "failed"
    | null;
  proxyVersion?: number | null;
  playbackUrl?: string | null;
  agencyProjectId?: string | null;
}

export interface SaveMediaAssetInput {
  fileName: string;
  publicUrl: string;
  mimeType: string;
  objectKey?: string;
  userId?: string;
  folder?: string | null;
  fileSize?: number;
  agencyProjectId?: string | null;
}

export interface FetchMediaAssetsParams {
  userId?: string;
  /** Pass "" for vault root (assets with null folder). Omit only when intentionally fetching all. */
  folder?: string;
  agencyProjectId?: string;
}

export interface MediaClientRecord {
  userId: string;
  assetCount: number;
}

/** Normalizes sidebar folder paths (e.g. "shared/Day_01/") to DB keys ("shared/Day_01"). */
export function normalizeMediaFolder(folder: string): string {
  return folder.replace(/^\/+|\/+$/g, "");
}

export function mediaFolderForSave(folder: string): string | null {
  const normalized = normalizeMediaFolder(folder);
  return normalized || null;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|mxf|mkv|avi)$/i;

/**
 * Normalizes potentially malformed absolute URLs (e.g. `https:/foo` → `https://foo`)
 * so browsers never treat them as relative (which becomes `/https:/foo` on Vercel).
 */
export function sanitizeAbsoluteMediaUrl(url: string): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";

  // Fix common "missing slash" typo: https:/example.com → https://example.com
  const fixedProtocol = raw
    .replace(/^https:\/*/i, "https://")
    .replace(/^http:\/*/i, "http://");

  // If someone accidentally prefixed a leading slash (browser will treat as relative path)
  // e.g. /https:/media.rendorax.com/... → https://media.rendorax.com/...
  const withoutLeadingSlash = fixedProtocol.replace(/^\/+(https?:\/\/)/i, "$1");

  return withoutLeadingSlash;
}

function getNormalizedR2PublicBase(): string {
  const env = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").trim();
  // Production safety: if env is missing/misconfigured, fall back to the known
  // public R2 CDN host so we never regress to Supabase signed URLs.
  if (!env) return "https://media.rendorax.com";
  const fixed = sanitizeAbsoluteMediaUrl(env);
  return fixed.replace(/\/+$/, "");
}

export function isMediaAssetVideo(asset: {
  fileName: string;
  mimeType?: string | null;
}): boolean {
  if (asset.mimeType?.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.test(asset.fileName);
}

/** Resolves the original mezzanine CDN URL (downloads / share links). */
export function getMediaOriginalUrl(asset: {
  publicUrl?: string | null;
  url?: string | null;
  objectKey?: string | null;
}): string {
  const objectKey = asset.objectKey?.replace(/^\/+/, "").trim();
  const storedRaw = (asset.publicUrl ?? asset.url ?? "").trim();
  const stored = storedRaw ? sanitizeAbsoluteMediaUrl(storedRaw) : "";
  const cdnBase = getNormalizedR2PublicBase();

  if (objectKey) {
    return sanitizeAbsoluteMediaUrl(`${cdnBase}/${objectKey}`);
  }

  return stored;
}

const ACTIVE_PROCESSING_STATUSES = new Set([
  "queued",
  "probing",
  "transcoding",
  "uploading",
]);

export function isMediaAssetProcessing(asset: {
  processingStatus?: MediaAssetRecord["processingStatus"];
}): boolean {
  const status = asset.processingStatus;
  return Boolean(status && ACTIVE_PROCESSING_STATUSES.has(status));
}

/** Resolves dashboard playback URL (HLS / proxy preferred over raw mezzanine). */
export function getMediaPlaybackUrl(asset: {
  publicUrl?: string | null;
  url?: string | null;
  objectKey?: string | null;
  mimeType?: string | null;
  playbackUrl?: string | null;
  playbackObjectKey?: string | null;
  playbackFormat?: MediaAssetRecord["playbackFormat"];
  processingStatus?: MediaAssetRecord["processingStatus"];
}): string {
  const isVideo = asset.mimeType?.startsWith("video/");
  const cdnBase = getNormalizedR2PublicBase();
  const hasPipelineMetadata =
    asset.playbackUrl != null ||
    asset.playbackObjectKey != null ||
    asset.playbackFormat != null ||
    asset.processingStatus != null;

  if (isVideo && hasPipelineMetadata) {
    if (asset.processingStatus === "ready") {
      const storedPlaybackUrl = asset.playbackUrl?.trim();
      if (storedPlaybackUrl) {
        return sanitizeAbsoluteMediaUrl(storedPlaybackUrl);
      }

      const playbackObjectKey = asset.playbackObjectKey?.trim();
      if (playbackObjectKey) {
        return sanitizeAbsoluteMediaUrl(`${cdnBase}/${playbackObjectKey}`);
      }
    }

    if (isMediaAssetProcessing(asset)) {
      return getMediaOriginalUrl(asset);
    }

    if (asset.processingStatus === "failed") {
      return getMediaOriginalUrl(asset);
    }
  }

  return getMediaOriginalUrl(asset);
}

/** Resolves a static poster URL for video assets when available. */
export function getMediaThumbnailUrl(asset: {
  thumbnailUrl?: string | null;
  objectKey?: string | null;
  mimeType?: string | null;
  fileName?: string;
}): string | null {
  const stored = asset.thumbnailUrl?.trim();
  if (stored) return sanitizeAbsoluteMediaUrl(stored);

  const objectKey = asset.objectKey?.replace(/^\/+/, "").trim();
  const cdnBase = getNormalizedR2PublicBase();

  if (!objectKey || !cdnBase) {
    return null;
  }

  const isVideo =
    asset.mimeType?.startsWith("video/") ||
    (asset.fileName ? VIDEO_EXTENSIONS.test(asset.fileName) : false);

  if (!isVideo) {
    return null;
  }

  const stem = objectKey.replace(/^uploads\//, "").replace(/\.[^/.]+$/, "");
  return sanitizeAbsoluteMediaUrl(`${cdnBase}/thumbnails/${stem}.webp`);
}

/** Shared grid thumbnail resolver for vault and CDN galleries. */
export function resolveGalleryThumbnail(
  asset: {
    thumbnailUrl?: string | null;
    objectKey?: string | null;
    mimeType?: string | null;
    fileName?: string;
  },
  playbackUrl: string,
): string | null {
  const isImage = asset.mimeType?.startsWith("image/");
  if (isImage && playbackUrl) return playbackUrl;

  const isVideo =
    asset.mimeType?.startsWith("video/") ||
    (asset.fileName ? VIDEO_EXTENSIONS.test(asset.fileName) : false);

  if (!isVideo) return null;

  return getMediaThumbnailUrl({
    thumbnailUrl: asset.thumbnailUrl,
    objectKey: asset.objectKey,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  });
}

/** Expands `shared/Day_01` → [`shared`, `shared/Day_01`]. */
export function expandFolderPathSegments(folder: string): string[] {
  const parts = folder.split("/").filter(Boolean);
  const paths: string[] = [];
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    paths.push(path);
  }
  return paths;
}

export function collectFolderPathsFromAssets(
  assets: MediaAssetRecord[],
): string[] {
  const folderSet = new Set<string>();
  for (const asset of assets) {
    if (!asset.folder) continue;
    for (const segment of expandFolderPathSegments(asset.folder)) {
      folderSet.add(segment);
    }
  }
  return Array.from(folderSet).sort();
}

export function mergeFolderPathLists(...lists: string[][]): string[] {
  const folderSet = new Set<string>();
  for (const list of lists) {
    for (const folder of list) {
      for (const segment of expandFolderPathSegments(folder)) {
        folderSet.add(segment);
      }
    }
  }
  return Array.from(folderSet).sort();
}

export async function fetchAllFolderPaths(userId: string): Promise<string[]> {
  const [assets, virtualFolders] = await Promise.all([
    fetchMediaAssets({ userId }),
    fetchMediaFolders(),
  ]);
  return mergeFolderPathLists(
    collectFolderPathsFromAssets(assets),
    virtualFolders,
  );
}

export async function fetchMediaFolders(): Promise<string[]> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/folders`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media folders (${res.status})`,
    );
  }

  return res.json();
}

export async function createMediaFolder(path: string): Promise<string> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/folders`, {
    method: "POST",
    headers,
    body: JSON.stringify({ path: normalizeMediaFolder(path) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to create media folder (${res.status})`,
    );
  }

  const data = (await res.json()) as { path: string };
  return data.path;
}

export function buildMediaAssetFetchParams(
  currentFolder: string,
  userId: string,
): FetchMediaAssetsParams {
  return {
    userId,
    folder: normalizeMediaFolder(currentFolder),
  };
}

export interface R2StorageObject {
  key: string;
  fileName: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number | null;
  lastModified: string;
}

export interface FetchR2StorageParams {
  prefix?: string;
  folder?: string;
}

export function mapR2ObjectToMediaAsset(
  object: R2StorageObject,
): MediaAssetRecord {
  return {
    id: object.key,
    fileName: object.fileName,
    publicUrl: object.publicUrl,
    objectKey: object.key,
    mimeType: object.mimeType,
    fileSize: object.fileSize,
    folder: null,
    userId: null,
    createdAt: object.lastModified,
    updatedAt: object.lastModified,
  };
}

export async function fetchR2StorageList(
  params?: FetchR2StorageParams,
): Promise<MediaAssetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.prefix) searchParams.set("prefix", params.prefix);
  if (params?.folder !== undefined) searchParams.set("folder", params.folder);

  const query = searchParams.toString();
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(
    `/api/storage/r2/list${query ? `?${query}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch R2 storage list (${res.status})`,
    );
  }

  const data = (await res.json()) as { objects: R2StorageObject[] };
  return data.objects.map(mapR2ObjectToMediaAsset);
}

/** Admin HQ: distinct clients with media assets (R2 + Prisma). */
export async function fetchMediaClients(): Promise<MediaClientRecord[]> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch("/api/media/clients", { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media clients (${res.status})`,
    );
  }

  return res.json();
}

export async function fetchMediaAssets(
  params?: FetchMediaAssetsParams,
): Promise<MediaAssetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.set("userId", params.userId);
  if (params?.folder !== undefined) searchParams.set("folder", params.folder);
  if (params?.agencyProjectId) {
    searchParams.set("agencyProjectId", params.agencyProjectId);
  }

  const query = searchParams.toString();
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(
    `/api/media/assets${query ? `?${query}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media assets (${res.status})`,
    );
  }

  const data = (await res.json()) as MediaAssetRecord[];
  return data;
}

export async function saveMediaAsset(
  input: SaveMediaAssetInput,
): Promise<MediaAssetRecord> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/assets`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const details = (body as { details?: string }).details;
    throw new Error(
      details ||
        (body as { error?: string }).error ||
        `Failed to save media asset (${res.status})`,
    );
  }

  return res.json();
}

export interface UpdateMediaAssetInput {
  fileName?: string;
  folder?: string | null;
  agencyProjectId?: string | null;
}

export async function updateMediaAsset(
  assetId: string,
  input: UpdateMediaAssetInput,
): Promise<MediaAssetRecord> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/assets/${assetId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to update media asset (${res.status})`,
    );
  }

  return res.json();
}

export async function deleteMediaAsset(assetId: string): Promise<void> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/assets/${assetId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to delete media asset (${res.status})`,
    );
  }
}

export async function deleteMediaAssetsInFolder(
  folderPath: string,
): Promise<number> {
  const headers = await getBackendAuthHeaders();
  const res = await backendFetch(`/api/media/assets/folder`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ folderPath }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to delete folder assets (${res.status})`,
    );
  }

  const data = (await res.json()) as { deletedCount: number };
  return data.deletedCount;
}

import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { GallerySelectableAsset } from "@/store/useDashboardStore";
import { showToast } from "@/store/useToastStore";
import { getBackendAuthHeaders } from "@/utils/backendAuth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const ZIP_DOWNLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export async function fetchR2DownloadUrl(
  objectKey: string,
  fileName: string,
): Promise<string> {
  const params = new URLSearchParams({ key: objectKey, fileName });
  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${BACKEND_URL}/api/storage/r2/download?${params.toString()}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || "Failed to get download URL",
    );
  }

  const data = (await res.json()) as { downloadUrl: string };
  return data.downloadUrl;
}

export async function downloadR2Asset(
  objectKey: string,
  fileName: string,
): Promise<void> {
  const downloadUrl = await fetchR2DownloadUrl(objectKey, fileName);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.rel = "noopener";
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function downloadFromUrl(
  url: string,
  fileName: string,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  saveAs(blob, fileName);
}

export async function copyShareLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  showToast("Link copied to clipboard");
}

function uniqueZipName(fileName: string, used: Map<string, number>): string {
  const count = used.get(fileName) ?? 0;
  used.set(fileName, count + 1);
  if (count === 0) return fileName;
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return `${fileName} (${count})`;
  const base = fileName.slice(0, dot);
  const ext = fileName.slice(dot);
  return `${base} (${count})${ext}`;
}

async function fetchAssetBlob(asset: GallerySelectableAsset): Promise<Blob> {
  if (asset.source === "cloud") {
    const objectKey = asset.objectKey ?? asset.id;
    const downloadUrl = await fetchR2DownloadUrl(objectKey, asset.fileName);
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${asset.fileName}`);
    }
    return response.blob();
  }

  if (!asset.vaultDownloadUrl) {
    throw new Error(`Missing download URL for ${asset.fileName}`);
  }

  const response = await fetch(asset.vaultDownloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${asset.fileName}`);
  }
  return response.blob();
}

export async function downloadSelectedAsZip(
  assets: GallerySelectableAsset[],
  zipLabel = "rendorax-assets",
): Promise<void> {
  if (assets.length === 0) return;

  const totalBytes = assets.reduce(
    (sum, asset) => sum + (asset.fileSize ?? 0),
    0,
  );

  if (totalBytes > ZIP_DOWNLOAD_MAX_BYTES) {
    showToast(
      "Selection exceeds 2 GB. Download large broadcast files individually.",
      "warning",
    );
    return;
  }

  if (assets.length === 1) {
    const asset = assets[0];
    if (asset.source === "cloud") {
      await downloadR2Asset(asset.objectKey ?? asset.id, asset.fileName);
    } else if (asset.vaultDownloadUrl) {
      await downloadFromUrl(asset.vaultDownloadUrl, asset.fileName);
    }
    showToast("Download started");
    return;
  }

  showToast(`Preparing ZIP (${assets.length} files)…`, "success");

  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const asset of assets) {
    const blob = await fetchAssetBlob(asset);
    zip.file(uniqueZipName(asset.fileName, usedNames), blob);
  }

  const archive = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(archive, `${zipLabel}-${stamp}.zip`);
  showToast("ZIP download started");
}

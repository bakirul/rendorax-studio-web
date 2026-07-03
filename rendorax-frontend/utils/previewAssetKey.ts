export function getPreviewAssetKey(file: {
  previewKey?: string;
  assetId?: string;
  name: string;
}): string {
  return file.previewKey ?? file.assetId ?? file.name;
}

export function getSelectableAssetPreviewKey(asset: {
  previewKey?: string;
  id: string;
  fileName: string;
}): string {
  return asset.previewKey ?? asset.id ?? asset.fileName;
}

export function buildPreviewPlayerKey(file: {
  assetId?: string;
  previewKey?: string;
  name: string;
  publicUrl?: string;
  url?: string;
  isCdn?: boolean;
} | null): string {
  if (!file) return "";
  const playbackUrl = (file.publicUrl ?? file.url ?? "").trim();
  const identity = file.assetId ?? file.previewKey ?? file.name;
  const scope = file.isCdn ? "cdn" : "vault";
  return `${scope}-${identity}-${playbackUrl}`;
}

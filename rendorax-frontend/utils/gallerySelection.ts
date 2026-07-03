import type { GallerySelectableAsset } from "@/store/useDashboardStore";

export interface ViewportRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function normalizeViewportRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): ViewportRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  };
}

export function rectsIntersect(a: ViewportRect, b: ViewportRect): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export function domRectToViewport(rect: DOMRect): ViewportRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

export function buildAssetMap(
  assets: GallerySelectableAsset[],
): Map<string, GallerySelectableAsset> {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

export function applyMarqueeSelection(
  intersectingIds: Set<string>,
  visibleAssets: GallerySelectableAsset[],
  baseSelection: GallerySelectableAsset[],
  toggleMode: boolean,
): GallerySelectableAsset[] {
  const assetMap = buildAssetMap(visibleAssets);

  if (!toggleMode) {
    return visibleAssets.filter((asset) => intersectingIds.has(asset.id));
  }

  const baseSelectedIds = new Set(baseSelection.map((asset) => asset.id));
  const result = new Map(baseSelection.map((asset) => [asset.id, asset]));

  for (const id of intersectingIds) {
    if (baseSelectedIds.has(id)) {
      result.delete(id);
    } else {
      const asset = assetMap.get(id);
      if (asset) result.set(id, asset);
    }
  }

  return Array.from(result.values());
}

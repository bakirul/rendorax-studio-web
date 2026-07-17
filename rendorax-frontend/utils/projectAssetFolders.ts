/**
 * Reserved MediaAsset.folder paths for project lifecycle taxonomy.
 * No schema fields — classification uses existing `folder` string only.
 */
export const PROJECT_ASSET_FOLDER = {
  CLIENT_MATERIALS: "01_CLIENT_MATERIALS",
  WORKING_FILES: "02_WORKING_FILES",
  REVIEW: "03_REVIEW",
  PICTURE_LOCK: "04_PICTURE_LOCK",
  MASTER_DELIVERY: "05_MASTER_DELIVERY",
} as const;

export type ProjectAssetFolder =
  (typeof PROJECT_ASSET_FOLDER)[keyof typeof PROJECT_ASSET_FOLDER];

/**
 * UI-only display labels for reserved folder path segments.
 * Stored folder IDs / path strings must remain unchanged.
 */
export const PROJECT_ASSET_FOLDER_DISPLAY_LABEL: Record<
  ProjectAssetFolder,
  string
> = {
  [PROJECT_ASSET_FOLDER.CLIENT_MATERIALS]: "Client Materials",
  [PROJECT_ASSET_FOLDER.WORKING_FILES]: "Working Files",
  [PROJECT_ASSET_FOLDER.REVIEW]: "Review Versions",
  [PROJECT_ASSET_FOLDER.PICTURE_LOCK]: "Picture Lock",
  [PROJECT_ASSET_FOLDER.MASTER_DELIVERY]: "Master Delivery",
};

const REVIEW_DELIVERY_ROOTS = new Set<string>([
  PROJECT_ASSET_FOLDER.REVIEW,
  PROJECT_ASSET_FOLDER.PICTURE_LOCK,
  PROJECT_ASSET_FOLDER.MASTER_DELIVERY,
]);

const ASSET_LIBRARY_ROOTS = new Set<string>([
  PROJECT_ASSET_FOLDER.CLIENT_MATERIALS,
  PROJECT_ASSET_FOLDER.WORKING_FILES,
]);

/** Display label for a single path segment (or full path's leaf). */
export function getFolderDisplayLabel(segmentOrPath: string): string {
  const clean = segmentOrPath.replace(/\/+$/, "");
  const segment = clean.includes("/")
    ? (clean.split("/").pop() ?? clean)
    : clean;
  return (
    PROJECT_ASSET_FOLDER_DISPLAY_LABEL[segment as ProjectAssetFolder] ?? segment
  );
}

function topLevelFolder(path: string): string {
  return path.replace(/\/+$/, "").split("/")[0] ?? "";
}

/** Reserved Review & Delivery taxonomy roots (and their descendants). */
export function isReviewDeliveryFolderPath(path: string): boolean {
  return REVIEW_DELIVERY_ROOTS.has(topLevelFolder(path));
}

/** Reserved Asset Library taxonomy roots (and their descendants). */
export function isAssetLibraryFolderPath(path: string): boolean {
  return ASSET_LIBRARY_ROOTS.has(topLevelFolder(path));
}

/**
 * Partition vault folder paths for sidebar sections without mutating records.
 * Unknown / custom folders surface under Asset Library (source).
 */
export function partitionProjectBinFolders(folders: string[]): {
  reviewDelivery: string[];
  assetLibrary: string[];
} {
  const reviewDelivery: string[] = [];
  const assetLibrary: string[] = [];

  for (const folder of folders) {
    const clean = folder.replace(/\/+$/, "");
    if (!clean) continue;
    if (isReviewDeliveryFolderPath(clean)) {
      reviewDelivery.push(folder);
    } else {
      assetLibrary.push(folder);
    }
  }

  return { reviewDelivery, assetLibrary };
}

type ReviewClassifiableAsset = {
  folder?: string | null;
  agencyProjectId?: string | null;
};

/** Project-linked asset in the reserved Review folder (unlinked staging excluded). */
export function isReviewVersionAsset(
  asset: ReviewClassifiableAsset | null | undefined,
): boolean {
  if (!asset?.agencyProjectId) return false;

  const folder = asset.folder?.trim();
  if (!folder) return false;

  return (
    folder === PROJECT_ASSET_FOLDER.REVIEW ||
    folder.startsWith(`${PROJECT_ASSET_FOLDER.REVIEW}/`)
  );
}

/** Project-linked asset in the reserved Master Delivery folder. */
export function isMasterDeliveryAsset(
  asset: ReviewClassifiableAsset | null | undefined,
): boolean {
  if (!asset?.agencyProjectId) return false;

  const folder = asset.folder?.trim();
  if (!folder) return false;

  return (
    folder === PROJECT_ASSET_FOLDER.MASTER_DELIVERY ||
    folder.startsWith(`${PROJECT_ASSET_FOLDER.MASTER_DELIVERY}/`)
  );
}

function folderMatchesPrefix(
  folder: string | null | undefined,
  prefix: string,
): boolean {
  const value = folder?.trim().replace(/\/+$/, "");
  if (!value) return false;
  return value === prefix || value.startsWith(`${prefix}/`);
}

/**
 * Map a cloud folder path to a project asset class chip.
 * Used so sidebar folder selection stays in sync with gallery filters.
 */
export function resolveProjectAssetClassFromFolder(
  folder: string | null | undefined,
): "review_versions" | "master_delivery" | null {
  if (folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.MASTER_DELIVERY)) {
    return "master_delivery";
  }
  if (folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.REVIEW)) {
    return "review_versions";
  }
  return null;
}

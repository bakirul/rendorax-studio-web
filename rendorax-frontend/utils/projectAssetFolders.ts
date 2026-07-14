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

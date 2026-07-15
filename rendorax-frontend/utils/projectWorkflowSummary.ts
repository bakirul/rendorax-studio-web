import { PROJECT_ASSET_FOLDER } from "@/utils/projectAssetFolders";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import type { ReviewDecision } from "@/utils/reviewDecisions";
import type { PictureLockEvent } from "@/utils/pictureLock";

export type ProjectWorkflowCounts = {
  clientMaterials: number;
  workingFiles: number;
  reviewVersions: number;
  masterDeliveries: number;
};

export type ProjectWorkflowReviewStatusLabel =
  | "Pending Review"
  | "Submitted For Review"
  | "Revision Requested"
  | "Approved"
  | "Admin Override";

export type ProjectWorkflowLockStatusLabel = "Unlocked" | "Locked";

export type ProjectWorkflowActivity = {
  actorLabel: string;
  at: string;
};

function folderMatchesPrefix(
  folder: string | null | undefined,
  prefix: string,
): boolean {
  const value = folder?.trim();
  if (!value) return false;
  return value === prefix || value.startsWith(`${prefix}/`);
}

export function isLifecycleSpecialFolder(
  folder: string | null | undefined,
): boolean {
  return (
    folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.REVIEW) ||
    folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.PICTURE_LOCK) ||
    folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.MASTER_DELIVERY)
  );
}

export function isProjectReviewVersionFolder(
  folder: string | null | undefined,
): boolean {
  return folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.REVIEW);
}

export function isProjectMasterDeliveryFolder(
  folder: string | null | undefined,
): boolean {
  return folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.MASTER_DELIVERY);
}

export function countProjectWorkflowAssets(
  assets: MediaAssetRecord[],
  projectClientId: string | null | undefined,
): ProjectWorkflowCounts {
  let clientMaterials = 0;
  let workingFiles = 0;
  let reviewVersions = 0;
  let masterDeliveries = 0;

  for (const asset of assets) {
    if (isProjectReviewVersionFolder(asset.folder)) {
      reviewVersions += 1;
      continue;
    }

    if (isProjectMasterDeliveryFolder(asset.folder)) {
      masterDeliveries += 1;
      continue;
    }

    if (isLifecycleSpecialFolder(asset.folder)) {
      continue;
    }

    if (projectClientId && asset.userId === projectClientId) {
      clientMaterials += 1;
    } else {
      workingFiles += 1;
    }
  }

  return { clientMaterials, workingFiles, reviewVersions, masterDeliveries };
}

export function getProjectReviewStatusLabel(
  latest: ReviewDecision | null | undefined,
): ProjectWorkflowReviewStatusLabel {
  switch (latest?.status) {
    case "submitted_for_review":
      return "Submitted For Review";
    case "revision_requested":
      return "Revision Requested";
    case "approved":
      return "Approved";
    case "admin_override":
      return "Admin Override";
    default:
      return "Pending Review";
  }
}

export function getProjectPictureLockLabel(
  latest: PictureLockEvent | null | undefined,
): ProjectWorkflowLockStatusLabel {
  return latest?.eventType === "locked" ? "Locked" : "Unlocked";
}

export function formatWorkflowActivityDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type NamedActor = {
  displayName?: string | null;
  email?: string | null;
};

export function resolveWorkflowActorLabel(
  actor: NamedActor | null | undefined,
  fallback = "Unknown",
): string {
  const displayName = actor?.displayName?.trim();
  if (displayName) return displayName;
  const email = actor?.email?.trim();
  if (email) return email;
  return fallback;
}

type ActivityCandidate = {
  at: string;
  actorLabel: string;
};

export function pickLatestWorkflowActivity(
  candidates: Array<ActivityCandidate | null | undefined>,
): ProjectWorkflowActivity | null {
  let latest: ActivityCandidate | null = null;

  for (const candidate of candidates) {
    if (!candidate?.at) continue;
    if (!latest || candidate.at > latest.at) {
      latest = candidate;
    }
  }

  return latest;
}

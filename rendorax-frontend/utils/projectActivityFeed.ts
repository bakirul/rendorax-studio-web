import { PROJECT_ASSET_FOLDER } from "@/utils/projectAssetFolders";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import type { ReviewDecision } from "@/utils/reviewDecisions";
import type { PictureLockEvent } from "@/utils/pictureLock";
import {
  isLifecycleSpecialFolder,
  isProjectReviewVersionFolder,
  resolveWorkflowActorLabel,
} from "@/utils/projectWorkflowSummary";

export type ProjectActivityEventType =
  | "client_material_uploaded"
  | "working_file_uploaded"
  | "review_version_uploaded"
  | "submitted_for_review"
  | "revision_requested"
  | "approved"
  | "admin_override"
  | "picture_locked"
  | "picture_unlocked";

export type ProjectActivityEvent = {
  id: string;
  type: ProjectActivityEventType;
  actorLabel: string;
  assetLabel?: string;
  note?: string;
  createdAt: string;
};

type AgencyUserLookup = {
  id: string;
  email?: string;
  displayName?: string | null;
};

function folderMatchesPrefix(
  folder: string | null | undefined,
  prefix: string,
): boolean {
  const value = folder?.trim();
  if (!value) return false;
  return value === prefix || value.startsWith(`${prefix}/`);
}

/** Phase 1 ignores future lifecycle folders beyond review for upload events. */
function isIgnoredLifecycleUploadFolder(
  folder: string | null | undefined,
): boolean {
  return (
    folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.PICTURE_LOCK) ||
    folderMatchesPrefix(folder, PROJECT_ASSET_FOLDER.MASTER_DELIVERY)
  );
}

export function getProjectActivityLabel(type: ProjectActivityEventType): string {
  switch (type) {
    case "client_material_uploaded":
      return "Client uploaded material";
    case "working_file_uploaded":
      return "Uploaded working file";
    case "review_version_uploaded":
      return "Uploaded review version";
    case "submitted_for_review":
      return "Submitted for review";
    case "revision_requested":
      return "Requested revision";
    case "approved":
      return "Approved review version";
    case "admin_override":
      return "Admin override";
    case "picture_locked":
      return "Picture locked";
    case "picture_unlocked":
      return "Picture unlocked";
    default:
      return "Activity";
  }
}

export function classifyUploadActivityType(
  asset: MediaAssetRecord,
  projectClientId: string | null | undefined,
): ProjectActivityEventType | null {
  if (isProjectReviewVersionFolder(asset.folder)) {
    return "review_version_uploaded";
  }

  if (isIgnoredLifecycleUploadFolder(asset.folder)) {
    return null;
  }

  // Defensive: any other special folder should not appear as materials/working.
  if (isLifecycleSpecialFolder(asset.folder)) {
    return null;
  }

  if (projectClientId && asset.userId === projectClientId) {
    return "client_material_uploaded";
  }

  return "working_file_uploaded";
}

export function buildUploadActivityEvents(
  assets: MediaAssetRecord[],
  projectClientId: string | null | undefined,
  agencyUsers: AgencyUserLookup[],
): ProjectActivityEvent[] {
  const usersById = new Map(agencyUsers.map((user) => [user.id, user] as const));
  const events: ProjectActivityEvent[] = [];

  for (const asset of assets) {
    const type = classifyUploadActivityType(asset, projectClientId);
    if (!type) continue;

    const uploader = asset.userId ? usersById.get(asset.userId) : undefined;
    events.push({
      id: `upload:${asset.id}`,
      type,
      actorLabel: resolveWorkflowActorLabel(uploader, "Uploader"),
      assetLabel: asset.fileName,
      createdAt: asset.createdAt,
    });
  }

  return events;
}

export function buildReviewDecisionActivityEvents(
  decisions: ReviewDecision[],
  assetsById: Map<string, MediaAssetRecord>,
): ProjectActivityEvent[] {
  const events: ProjectActivityEvent[] = [];

  for (const decision of decisions) {
    let type: ProjectActivityEventType;
    switch (decision.status) {
      case "submitted_for_review":
        type = "submitted_for_review";
        break;
      case "revision_requested":
        type = "revision_requested";
        break;
      case "approved":
        type = "approved";
        break;
      case "admin_override":
        type = "admin_override";
        break;
      default:
        continue;
    }

    const asset = assetsById.get(decision.mediaAssetId);
    events.push({
      id: `decision:${decision.id}`,
      type,
      actorLabel: resolveWorkflowActorLabel(decision.actor),
      assetLabel: asset?.fileName,
      note: decision.note?.trim() || undefined,
      createdAt: decision.createdAt,
    });
  }

  return events;
}

export function buildPictureLockActivityEvents(
  lockEvents: PictureLockEvent[],
  assetsById: Map<string, MediaAssetRecord>,
): ProjectActivityEvent[] {
  const events: ProjectActivityEvent[] = [];

  for (const event of lockEvents) {
    const type: ProjectActivityEventType =
      event.eventType === "locked" ? "picture_locked" : "picture_unlocked";
    const asset = assetsById.get(event.mediaAssetId);

    events.push({
      id: `lock:${event.id}`,
      type,
      actorLabel: resolveWorkflowActorLabel(event.actor),
      assetLabel: asset?.fileName,
      note: event.note?.trim() || undefined,
      createdAt: event.createdAt,
    });
  }

  return events;
}

export function mergeProjectActivityEvents(
  groups: ProjectActivityEvent[][],
  limit = 8,
): ProjectActivityEvent[] {
  return groups
    .flat()
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, limit);
}

import {
  countOverdueTasks,
  isTaskOverdue,
  pickActiveReviewVersionAsset,
  resolveAssignedTeamSummary,
  resolveProjectOperationalStatus,
  type OperationalAssetLike,
  type OperationalTaskLike,
  type ProjectOperationalStatusKind,
  type ProjectOperationalStatusResult,
} from "@/utils/projectOperationalStatus";
import {
  hasActiveMasterDelivery,
  resolveMasterDeliveryClientAccess,
  type MasterDeliveryEvent,
} from "@/utils/masterDelivery";
import type { ReviewDecision } from "@/utils/reviewDecisions";
import type { ProjectFeedbackSummary } from "@/utils/projectFeedbackSummary";
import type { AssignedTeamSummary } from "@/utils/projectOperationalStatus";

/** Delivered items older than this window are omitted from the queue. */
export const DELIVERED_RECENT_DAYS = 14;

/** Soft concurrent limit for per-project / per-asset queue fetches. */
export const QUEUE_FETCH_CONCURRENCY = 4;

export type OperationsQueueBucketId =
  | "overdue"
  | "waiting_on_editor"
  | "waiting_on_client"
  | "waiting_on_delivery"
  | "blocked"
  | "delivered_recently";

export const OPERATIONS_QUEUE_BUCKET_ORDER: OperationsQueueBucketId[] = [
  "overdue",
  "waiting_on_editor",
  "waiting_on_client",
  "waiting_on_delivery",
  "blocked",
  "delivered_recently",
];

export const OPERATIONS_QUEUE_BUCKET_LABELS: Record<
  OperationsQueueBucketId,
  string
> = {
  overdue: "OVERDUE",
  waiting_on_editor: "WAITING ON EDITOR",
  waiting_on_client: "WAITING ON CLIENT",
  waiting_on_delivery: "WAITING ON DELIVERY",
  blocked: "BLOCKED",
  delivered_recently: "DELIVERED RECENTLY",
};

export type OperationsQueueItem = {
  projectId: string;
  projectTitle: string;
  clientId?: string | null;
  clientLabel: string;
  status: ProjectOperationalStatusKind;
  statusLabel: string;
  reason: string;
  assignedTeamLabel: string;
  rankAt?: string | null;
  overdueTaskCount: number;
  openFeedbackCount: number;
  activeReviewAssetName?: string | null;
  currentDeliveryName?: string | null;
  bucket: OperationsQueueBucketId;
  warnings: OperationsQueueWarning[];
};

export type OperationsQueueWarning = {
  label: string;
};

/** Project phases where missing tasks is worth surfacing. */
export const NO_TASK_WARNING_PHASES = new Set([
  "Offline Edit",
  "Color Grading",
  "Audio & Master",
  "Ready for Review",
  "Ready for Final Delivery",
]);

export type OperationsQueueProjectLike = {
  id: string;
  title?: string | null;
  clientId?: string | null;
  status?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  client?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
};

export type QueueAssetLike = OperationalAssetLike & {
  fileName?: string | null;
};

export type BuildOperationsQueueItemInput = {
  project: OperationsQueueProjectLike;
  tasks: OperationalTaskLike[];
  assets: QueueAssetLike[];
  activeDecision: ReviewDecision | null;
  openFeedbackCount: number;
  /**
   * Oldest open-feedback timestamp when available from summary `latest`.
   * Limitation: feedback summary only returns the 3 newest comments total,
   * not the oldest open note across the project.
   */
  openFeedbackOldestAt?: string | null;
  masterDeliveryCurrent?: MasterDeliveryEvent | null;
  now?: Date;
};

export type OperationsQueueBuckets = Record<
  OperationsQueueBucketId,
  OperationsQueueItem[]
>;

function toIso(value: string | Date | null | undefined): string | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatClientLabel(
  client:
    | { displayName?: string | null; email?: string | null }
    | null
    | undefined,
): string {
  const displayName = client?.displayName?.trim();
  if (displayName) return displayName;
  const email = client?.email?.trim();
  if (email) return email;
  return "Unassigned Client";
}

function statusToBucket(
  status: ProjectOperationalStatusKind,
): OperationsQueueBucketId | null {
  switch (status) {
    case "overdue":
      return "overdue";
    case "waiting_on_editor":
      return "waiting_on_editor";
    case "waiting_on_client":
      return "waiting_on_client";
    case "waiting_on_delivery":
      return "waiting_on_delivery";
    case "blocked":
      return "blocked";
    case "delivered":
      return "delivered_recently";
    case "healthy":
    default:
      return null;
  }
}

function earliestOverdueDueAt(
  tasks: OperationalTaskLike[],
  now: Date,
): string | null {
  let earliest: Date | null = null;
  for (const task of tasks) {
    if (!isTaskOverdue(task, now) || task.dueDate == null || task.dueDate === "") {
      continue;
    }
    const due =
      task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (!earliest || due.getTime() < earliest.getTime()) {
      earliest = due;
    }
  }
  return earliest ? earliest.toISOString() : null;
}

function isWithinDeliveredRecentWindow(
  delivery: MasterDeliveryEvent | null | undefined,
  now: Date,
): boolean {
  if (!delivery || !hasActiveMasterDelivery(delivery)) return false;
  const at = new Date(delivery.createdAt);
  if (Number.isNaN(at.getTime())) return false;
  const windowMs = DELIVERED_RECENT_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - at.getTime() <= windowMs;
}

/**
 * Bucket-specific rank timestamp used for sorting.
 * Waiting on Editor: prefers revision_requested createdAt; otherwise best-effort
 * open-feedback age from summary `latest` (see openFeedbackOldestAt limitation).
 */
export function resolveOperationsQueueRankAt(
  status: ProjectOperationalStatusKind,
  input: {
    tasks: OperationalTaskLike[];
    activeDecision: ReviewDecision | null;
    openFeedbackOldestAt?: string | null;
    masterDeliveryCurrent?: MasterDeliveryEvent | null;
    project: OperationsQueueProjectLike;
    now?: Date;
  },
): string | null {
  const now = input.now ?? new Date();

  switch (status) {
    case "overdue":
      return earliestOverdueDueAt(input.tasks, now);

    case "waiting_on_editor": {
      const revisionAt =
        input.activeDecision?.status === "revision_requested"
          ? toIso(input.activeDecision.createdAt)
          : null;
      if (revisionAt) return revisionAt;
      const feedbackAt = toIso(input.openFeedbackOldestAt);
      if (feedbackAt) return feedbackAt;
      return (
        toIso(input.project.updatedAt) ?? toIso(input.project.createdAt)
      );
    }

    case "waiting_on_client":
      return input.activeDecision?.status === "submitted_for_review"
        ? toIso(input.activeDecision.createdAt)
        : null;

    case "waiting_on_delivery":
      return input.activeDecision?.status === "approved"
        ? toIso(input.activeDecision.createdAt)
        : null;

    case "delivered":
      return toIso(input.masterDeliveryCurrent?.createdAt);

    case "blocked":
      return (
        toIso(input.project.createdAt) ?? toIso(input.project.updatedAt)
      );

    default:
      return null;
  }
}

/**
 * Oldest open comment among feedback summary `latest` rows.
 * Not a global oldest-open — summary only ships up to 3 newest comments.
 */
export function pickOpenFeedbackOldestAtFromSummary(
  summary: ProjectFeedbackSummary | null | undefined,
): string | null {
  if (!summary?.latest?.length) return null;
  let oldest: string | null = null;
  let oldestMs = Number.POSITIVE_INFINITY;

  for (const row of summary.latest) {
    if (row.is_resolved) continue;
    const iso = toIso(row.created_at);
    if (!iso) continue;
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) continue;
    if (ms < oldestMs) {
      oldestMs = ms;
      oldest = iso;
    }
  }

  return oldest;
}

function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const diffMs = now.getTime() - at;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function formatDayCount(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

function hasIncompleteTasks(tasks: OperationalTaskLike[]): boolean {
  return tasks.some((task) => task.status !== "done");
}

export type ResolveOperationsQueueWarningsInput = {
  status: ProjectOperationalStatusKind;
  activeDecision: ReviewDecision | null;
  openFeedbackCount: number;
  openFeedbackOldestAt?: string | null;
  assignment: AssignedTeamSummary;
  tasks: OperationalTaskLike[];
  projectPhase?: string | null;
  masterDeliveryCurrent?: MasterDeliveryEvent | null;
  rankAt?: string | null;
  now?: Date;
};

/**
 * Secondary stall/urgency chips — does not affect bucket or operational status.
 */
export function resolveOperationsQueueWarnings(
  input: ResolveOperationsQueueWarningsInput,
): OperationsQueueWarning[] {
  const now = input.now ?? new Date();
  const warnings: OperationsQueueWarning[] = [];
  const decision = input.activeDecision;
  const isDelivered = input.status === "delivered";

  if (input.status === "waiting_on_client") {
    if (decision?.status === "submitted_for_review") {
      const days = daysSince(decision.createdAt, now);
      if (days != null && days >= 1) {
        warnings.push({ label: `Waiting ${formatDayCount(days)}` });
      }
    }
  }

  if (input.status === "waiting_on_editor") {
    if (decision?.status === "revision_requested") {
      const days = daysSince(decision.createdAt, now);
      if (days != null && days >= 1) {
        warnings.push({
          label: `Revision requested ${formatDayCount(days)} ago`,
        });
      }
    } else if (input.openFeedbackCount > 0) {
      const days = daysSince(input.openFeedbackOldestAt, now);
      if (days != null && days >= 1) {
        warnings.push({ label: `Open feedback ${formatDayCount(days)} ago` });
      } else {
        warnings.push({ label: "Open feedback notes" });
      }
    }
  }

  if (input.status === "waiting_on_delivery") {
    if (decision?.status === "approved") {
      const days = daysSince(decision.createdAt, now);
      if (days != null && days >= 1) {
        warnings.push({ label: `Approved ${formatDayCount(days)} ago` });
      }
    }
  }

  if (!isDelivered && input.assignment.kind === "unassigned") {
    warnings.push({ label: "No editor assigned" });
  }

  const projectPhase = input.projectPhase?.trim() ?? "";
  if (
    !isDelivered &&
    NO_TASK_WARNING_PHASES.has(projectPhase) &&
    !hasIncompleteTasks(input.tasks)
  ) {
    warnings.push({ label: "No active tasks" });
  }

  const delivery = input.masterDeliveryCurrent;
  if (delivery) {
    const access = resolveMasterDeliveryClientAccess(delivery, now);
    if (access.status === "expired") {
      warnings.push({ label: "Delivery access expired" });
    }
  }

  return warnings;
}

/**
 * Build one queue item via resolveProjectOperationalStatus only.
 * Returns null for Healthy or Delivered older than DELIVERED_RECENT_DAYS.
 */
export function buildOperationsQueueItem(
  input: BuildOperationsQueueItemInput,
): OperationsQueueItem | null {
  const now = input.now ?? new Date();
  const clientId = input.project.clientId ?? null;
  const active = pickActiveReviewVersionAsset(input.assets);

  const latestDecisionByAssetId = new Map<
    string,
    ReviewDecision | null | undefined
  >();
  if (active) {
    latestDecisionByAssetId.set(active.id, input.activeDecision);
  }

  const resolved: ProjectOperationalStatusResult =
    resolveProjectOperationalStatus({
      clientId,
      tasks: input.tasks,
      assets: input.assets,
      latestDecisionByAssetId,
      openFeedbackCount: input.openFeedbackCount,
      masterDeliveryCurrent: input.masterDeliveryCurrent ?? null,
      now,
    });

  const bucket = statusToBucket(resolved.status);
  if (!bucket) return null;

  if (
    resolved.status === "delivered" &&
    !isWithinDeliveredRecentWindow(input.masterDeliveryCurrent, now)
  ) {
    return null;
  }

  const overdueTaskCount = countOverdueTasks(input.tasks, now);
  const assignment = resolveAssignedTeamSummary(input.tasks);
  const delivery = input.masterDeliveryCurrent ?? null;
  const rankAt = resolveOperationsQueueRankAt(resolved.status, {
    tasks: input.tasks,
    activeDecision: input.activeDecision,
    openFeedbackOldestAt: input.openFeedbackOldestAt,
    masterDeliveryCurrent: delivery,
    project: input.project,
    now,
  });

  const warnings = resolveOperationsQueueWarnings({
    status: resolved.status,
    activeDecision: input.activeDecision,
    openFeedbackCount: Math.max(0, input.openFeedbackCount || 0),
    openFeedbackOldestAt: input.openFeedbackOldestAt,
    assignment,
    tasks: input.tasks,
    projectPhase: input.project.status,
    masterDeliveryCurrent: delivery,
    rankAt,
    now,
  });

  return {
    projectId: input.project.id,
    projectTitle: input.project.title?.trim() || "Untitled Project",
    clientId,
    clientLabel: formatClientLabel(input.project.client),
    status: resolved.status,
    statusLabel: resolved.label,
    reason: resolved.reason,
    assignedTeamLabel: assignment.label,
    rankAt,
    overdueTaskCount,
    openFeedbackCount: Math.max(0, input.openFeedbackCount || 0),
    activeReviewAssetName: active?.fileName?.trim() || null,
    currentDeliveryName:
      delivery?.mediaAsset?.fileName?.trim() ||
      delivery?.mediaAssetId ||
      null,
    bucket,
    warnings,
  };
}

function compareRankAsc(a: OperationsQueueItem, b: OperationsQueueItem): number {
  const aMs = a.rankAt ? Date.parse(a.rankAt) : Number.POSITIVE_INFINITY;
  const bMs = b.rankAt ? Date.parse(b.rankAt) : Number.POSITIVE_INFINITY;
  const aValid = !Number.isNaN(aMs);
  const bValid = !Number.isNaN(bMs);
  if (!aValid && !bValid) {
    return a.projectTitle.localeCompare(b.projectTitle);
  }
  if (!aValid) return 1;
  if (!bValid) return -1;
  if (aMs !== bMs) return aMs - bMs;
  return a.projectTitle.localeCompare(b.projectTitle);
}

function compareRankDesc(a: OperationsQueueItem, b: OperationsQueueItem): number {
  const aMs = a.rankAt ? Date.parse(a.rankAt) : Number.NEGATIVE_INFINITY;
  const bMs = b.rankAt ? Date.parse(b.rankAt) : Number.NEGATIVE_INFINITY;
  const aValid = !Number.isNaN(aMs);
  const bValid = !Number.isNaN(bMs);
  if (!aValid && !bValid) {
    return a.projectTitle.localeCompare(b.projectTitle);
  }
  if (!aValid) return 1;
  if (!bValid) return -1;
  if (aMs !== bMs) return bMs - aMs;
  return a.projectTitle.localeCompare(b.projectTitle);
}

export function emptyOperationsQueueBuckets(): OperationsQueueBuckets {
  return {
    overdue: [],
    waiting_on_editor: [],
    waiting_on_client: [],
    waiting_on_delivery: [],
    blocked: [],
    delivered_recently: [],
  };
}

/** Group + sort items into buckets. Healthy never included. */
export function groupOperationsQueueItems(
  items: OperationsQueueItem[],
): OperationsQueueBuckets {
  const buckets = emptyOperationsQueueBuckets();
  for (const item of items) {
    buckets[item.bucket].push(item);
  }

  for (const id of OPERATIONS_QUEUE_BUCKET_ORDER) {
    if (id === "delivered_recently") {
      buckets[id].sort(compareRankDesc);
    } else {
      buckets[id].sort(compareRankAsc);
    }
  }

  return buckets;
}

export function countOperationsQueueItems(
  buckets: OperationsQueueBuckets,
): number {
  let total = 0;
  for (const id of OPERATIONS_QUEUE_BUCKET_ORDER) {
    total += buckets[id].length;
  }
  return total;
}

/** Promise pool with fixed concurrency (no unbounded Promise.all). */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

export function formatOperationsQueueRankDate(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function rankPhraseForBucket(
  bucket: OperationsQueueBucketId,
  rankAt: string | null | undefined,
): string | null {
  const formatted = formatOperationsQueueRankDate(rankAt);
  if (!formatted) return null;
  switch (bucket) {
    case "overdue":
      return `Due ${formatted}`;
    case "delivered_recently":
      return `Delivered ${formatted}`;
    case "blocked":
      return `Since ${formatted}`;
    default:
      return `Waiting since ${formatted}`;
  }
}

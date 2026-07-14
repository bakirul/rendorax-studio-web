import { isProjectReviewVersionFolder } from "@/utils/projectWorkflowSummary";
import type { ReviewDecision } from "@/utils/reviewDecisions";

export type ProjectOperationalStatusKind =
  | "blocked"
  | "overdue"
  | "waiting_on_editor"
  | "waiting_on_client"
  | "healthy";

export type ProjectOperationalStatusResult = {
  status: ProjectOperationalStatusKind;
  label: string;
  reason: string;
};

export type OperationalTaskLike = {
  status?: string | null;
  dueDate?: string | Date | null;
  assigneeId?: string | null;
  assignee?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
};

export type OperationalAssetLike = {
  id: string;
  folder?: string | null;
  createdAt: string;
};

export type AssignedTeamSummary =
  | { kind: "unassigned"; label: string }
  | { kind: "editor"; label: string; name: string }
  | { kind: "team"; label: string; count: number };

const STATUS_LABELS: Record<ProjectOperationalStatusKind, string> = {
  blocked: "BLOCKED",
  overdue: "OVERDUE",
  waiting_on_editor: "WAITING ON EDITOR",
  waiting_on_client: "WAITING ON CLIENT",
  healthy: "HEALTHY",
};

/** Local calendar start-of-day for overdue comparisons. */
export function startOfLocalDay(reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
}

export function isTaskOverdue(
  task: OperationalTaskLike,
  now: Date = new Date(),
): boolean {
  if (!task || task.status === "done") return false;
  if (task.dueDate == null || task.dueDate === "") return false;

  const due =
    task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;

  return due.getTime() < startOfLocalDay(now).getTime();
}

export function countOverdueTasks(
  tasks: OperationalTaskLike[],
  now: Date = new Date(),
): number {
  let count = 0;
  for (const task of tasks) {
    if (isTaskOverdue(task, now)) count += 1;
  }
  return count;
}

/**
 * Active Review Version = newest project-linked 03_REVIEW asset by createdAt.
 * Does not fall back to older versions' decisions.
 */
export function pickActiveReviewVersionAsset<T extends OperationalAssetLike>(
  assets: T[],
): T | null {
  let best: T | null = null;

  for (const asset of assets) {
    if (!isProjectReviewVersionFolder(asset.folder)) continue;
    if (!best || asset.createdAt > best.createdAt) {
      best = asset;
    }
  }

  return best;
}

export function getActiveReviewDecision(
  assets: OperationalAssetLike[],
  latestDecisionByAssetId: Map<string, ReviewDecision | null | undefined>,
): ReviewDecision | null {
  const active = pickActiveReviewVersionAsset(assets);
  if (!active) return null;
  return latestDecisionByAssetId.get(active.id) ?? null;
}

function formatAssigneeName(
  assignee:
    | { displayName?: string | null; email?: string | null }
    | null
    | undefined,
): string | null {
  const displayName = assignee?.displayName?.trim();
  if (displayName) return displayName;
  const email = assignee?.email?.trim();
  if (email) return email;
  return null;
}

export function resolveAssignedTeamSummary(
  tasks: OperationalTaskLike[],
): AssignedTeamSummary {
  const unique = new Map<string, string>();

  for (const task of tasks) {
    const id = task.assigneeId?.trim();
    if (!id) continue;
    const name = formatAssigneeName(task.assignee) ?? "Unassigned";
    if (!unique.has(id)) unique.set(id, name);
  }

  if (unique.size === 0) {
    return { kind: "unassigned", label: "Unassigned" };
  }

  if (unique.size === 1) {
    const name = [...unique.values()][0] ?? "Unassigned";
    return {
      kind: "editor",
      name,
      label: `Assigned Editor: ${name}`,
    };
  }

  return {
    kind: "team",
    count: unique.size,
    label: `Assigned Team: ${unique.size}`,
  };
}

export type ResolveProjectOperationalStatusInput = {
  clientId?: string | null;
  tasks: OperationalTaskLike[];
  assets: OperationalAssetLike[];
  latestDecisionByAssetId: Map<string, ReviewDecision | null | undefined>;
  openFeedbackCount: number;
  now?: Date;
};

export function resolveProjectOperationalStatus(
  input: ResolveProjectOperationalStatusInput,
): ProjectOperationalStatusResult {
  const now = input.now ?? new Date();
  const openFeedbackCount = Math.max(0, input.openFeedbackCount || 0);

  if (!input.clientId?.trim()) {
    return {
      status: "blocked",
      label: STATUS_LABELS.blocked,
      reason: "No client assigned",
    };
  }

  const overdueTaskCount = countOverdueTasks(input.tasks, now);
  if (overdueTaskCount > 0) {
    return {
      status: "overdue",
      label: STATUS_LABELS.overdue,
      reason:
        overdueTaskCount === 1
          ? "1 overdue task"
          : `${overdueTaskCount} overdue tasks`,
    };
  }

  const activeDecision = getActiveReviewDecision(
    input.assets,
    input.latestDecisionByAssetId,
  );
  const revisionRequested = activeDecision?.status === "revision_requested";
  const hasOpenFeedback = openFeedbackCount > 0;

  if (revisionRequested || hasOpenFeedback) {
    const parts: string[] = [];
    if (revisionRequested) parts.push("Revision requested");
    if (hasOpenFeedback) {
      parts.push(
        openFeedbackCount === 1
          ? "1 open feedback note"
          : `${openFeedbackCount} open feedback notes`,
      );
    }
    return {
      status: "waiting_on_editor",
      label: STATUS_LABELS.waiting_on_editor,
      reason: parts.join(" · "),
    };
  }

  if (activeDecision?.status === "submitted_for_review") {
    return {
      status: "waiting_on_client",
      label: STATUS_LABELS.waiting_on_client,
      reason: "Submitted for review · awaiting client decision",
    };
  }

  return {
    status: "healthy",
    label: STATUS_LABELS.healthy,
    reason: "No active blockers",
  };
}

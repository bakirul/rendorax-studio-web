import type { ProjectRequestStatus } from "@prisma/client";

export const PROJECT_REQUEST_TYPES = [
  "Commercial",
  "TV Program",
  "Promo",
  "Trailer",
  "Localization",
  "Subtitles",
  "Graphics Package",
  "Other",
] as const;

export type ProjectRequestType = (typeof PROJECT_REQUEST_TYPES)[number];

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 10000;
const DELIVERABLES_MAX = 5000;
const REFERENCE_LINKS_MAX = 5000;
const BUDGET_RANGE_MAX = 200;
const ADMIN_NOTE_MAX = 5000;

/** Phase 1 allowed status transitions. Terminal: approved, rejected. */
export const PROJECT_REQUEST_TRANSITIONS: Record<
  ProjectRequestStatus,
  readonly ProjectRequestStatus[]
> = {
  submitted: ["under_review", "needs_clarification", "rejected"],
  under_review: ["needs_clarification", "approved", "rejected"],
  needs_clarification: ["under_review", "rejected"],
  approved: [],
  rejected: [],
};

export function canTransitionProjectRequestStatus(
  from: ProjectRequestStatus,
  to: ProjectRequestStatus,
): boolean {
  return PROJECT_REQUEST_TRANSITIONS[from].includes(to);
}

export function statusRequiresAdminNote(status: ProjectRequestStatus): boolean {
  return status === "needs_clarification" || status === "rejected";
}

export function isAllowedProjectRequestType(
  value: string,
): value is ProjectRequestType {
  return (PROJECT_REQUEST_TYPES as readonly string[]).includes(value);
}

export type ParsedProjectRequestCreate = {
  title: string;
  projectType: ProjectRequestType;
  description: string;
  deliverables: string;
  referenceLinks: string | null;
  deadlineAt: Date | null;
  budgetRange: string | null;
};

export type ParseCreateResult =
  | { ok: true; data: ParsedProjectRequestCreate }
  | { ok: false; error: string };

function trimRequired(
  value: unknown,
  field: string,
  max: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: `${field} is required` };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `${field} is required` };
  }
  if (trimmed.length > max) {
    return { ok: false, error: `${field} must be at most ${max} characters` };
  }
  return { ok: true, value: trimmed };
}

function trimOptional(
  value: unknown,
  field: string,
  max: number,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be a string` };
  }
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > max) {
    return { ok: false, error: `${field} must be at most ${max} characters` };
  }
  return { ok: true, value: trimmed };
}

export function parseProjectRequestCreateBody(
  body: unknown,
): ParseCreateResult {
  const raw = (body ?? {}) as Record<string, unknown>;

  const title = trimRequired(raw.title, "title", TITLE_MAX);
  if (!title.ok) return title;

  const projectTypeRaw = trimRequired(raw.projectType, "projectType", 80);
  if (!projectTypeRaw.ok) return projectTypeRaw;
  if (!isAllowedProjectRequestType(projectTypeRaw.value)) {
    return {
      ok: false,
      error: `projectType must be one of: ${PROJECT_REQUEST_TYPES.join(", ")}`,
    };
  }

  const description = trimRequired(raw.description, "description", DESCRIPTION_MAX);
  if (!description.ok) return description;

  const deliverables = trimRequired(
    raw.deliverables,
    "deliverables",
    DELIVERABLES_MAX,
  );
  if (!deliverables.ok) return deliverables;

  const referenceLinks = trimOptional(
    raw.referenceLinks,
    "referenceLinks",
    REFERENCE_LINKS_MAX,
  );
  if (!referenceLinks.ok) return referenceLinks;

  const budgetRange = trimOptional(raw.budgetRange, "budgetRange", BUDGET_RANGE_MAX);
  if (!budgetRange.ok) return budgetRange;

  let deadlineAt: Date | null = null;
  if (
    raw.deadlineAt !== undefined &&
    raw.deadlineAt !== null &&
    raw.deadlineAt !== ""
  ) {
    if (typeof raw.deadlineAt !== "string") {
      return { ok: false, error: "deadlineAt must be an ISO date string" };
    }
    const parsed = new Date(raw.deadlineAt.trim());
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "deadlineAt must be a valid date" };
    }
    deadlineAt = parsed;
  }

  return {
    ok: true,
    data: {
      title: title.value,
      projectType: projectTypeRaw.value,
      description: description.value,
      deliverables: deliverables.value,
      referenceLinks: referenceLinks.value,
      deadlineAt,
      budgetRange: budgetRange.value,
    },
  };
}

export function parseAdminNote(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  return trimOptional(value, "adminNote", ADMIN_NOTE_MAX);
}

export const PROJECT_REQUEST_STATUS_VALUES = new Set<string>([
  "submitted",
  "needs_clarification",
  "under_review",
  "approved",
  "rejected",
]);

export function isProjectRequestStatus(
  value: string,
): value is ProjectRequestStatus {
  return PROJECT_REQUEST_STATUS_VALUES.has(value);
}

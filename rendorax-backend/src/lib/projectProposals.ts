import type { ProjectProposalStatus } from "@prisma/client";

const TIMELINE_MAX = 2000;
const DELIVERABLES_MAX = 5000;
const NOTES_MAX = 5000;
const TERMS_MAX = 5000;
const CURRENCY_MAX = 8;

export type ParsedProposalCreate = {
  estimatedCostCents: number;
  currency: string;
  timelineText: string;
  deliverablesText: string;
  notes: string | null;
  termsText: string | null;
};

export type ParseProposalResult =
  | { ok: true; data: ParsedProposalCreate }
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

export function parseProposalCreateBody(body: unknown): ParseProposalResult {
  const raw = (body ?? {}) as Record<string, unknown>;

  let estimatedCostCents: number;
  if (typeof raw.estimatedCostCents === "number") {
    estimatedCostCents = raw.estimatedCostCents;
  } else if (
    typeof raw.estimatedCostCents === "string" &&
    raw.estimatedCostCents.trim() !== ""
  ) {
    estimatedCostCents = Number(raw.estimatedCostCents);
  } else {
    return { ok: false, error: "estimatedCostCents is required" };
  }

  if (
    !Number.isFinite(estimatedCostCents) ||
    !Number.isInteger(estimatedCostCents) ||
    estimatedCostCents < 0
  ) {
    return {
      ok: false,
      error: "estimatedCostCents must be a non-negative integer",
    };
  }

  const currencyRaw =
    raw.currency === undefined || raw.currency === null || raw.currency === ""
      ? { ok: true as const, value: "USD" }
      : trimRequired(raw.currency, "currency", CURRENCY_MAX);
  if (!currencyRaw.ok) return currencyRaw;

  const timelineText = trimRequired(raw.timelineText, "timelineText", TIMELINE_MAX);
  if (!timelineText.ok) return timelineText;

  const deliverablesText = trimRequired(
    raw.deliverablesText,
    "deliverablesText",
    DELIVERABLES_MAX,
  );
  if (!deliverablesText.ok) return deliverablesText;

  const notes = trimOptional(raw.notes, "notes", NOTES_MAX);
  if (!notes.ok) return notes;

  const termsText = trimOptional(raw.termsText, "termsText", TERMS_MAX);
  if (!termsText.ok) return termsText;

  return {
    ok: true,
    data: {
      estimatedCostCents,
      currency: currencyRaw.value.toUpperCase(),
      timelineText: timelineText.value,
      deliverablesText: deliverablesText.value,
      notes: notes.value,
      termsText: termsText.value,
    },
  };
}

export type ProposalRespondAction = "approve" | "request_changes" | "reject";

export function parseProposalRespondBody(
  body: unknown,
):
  | { ok: true; action: ProposalRespondAction; note: string | null }
  | { ok: false; error: string } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const action =
    typeof raw.action === "string" ? raw.action.trim().toLowerCase() : "";

  if (
    action !== "approve" &&
    action !== "request_changes" &&
    action !== "reject"
  ) {
    return {
      ok: false,
      error: 'action must be "approve", "request_changes", or "reject"',
    };
  }

  const note = trimOptional(raw.note, "note", NOTES_MAX);
  if (!note.ok) return note;

  if (
    (action === "request_changes" || action === "reject") &&
    !note.value
  ) {
    return { ok: false, error: "note is required for this action" };
  }

  return { ok: true, action, note: note.value };
}

export function isMutableProposalStatus(
  status: ProjectProposalStatus,
): boolean {
  return status === "draft";
}

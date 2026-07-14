export type ReviewDecisionStatus =
  | "submitted_for_review"
  | "approved"
  | "revision_requested"
  | "admin_override";

export type ReviewDecisionActor = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

export type ReviewDecision = {
  id: string;
  mediaAssetId: string;
  agencyProjectId: string;
  status: ReviewDecisionStatus;
  actorId: string;
  actorRole: string;
  note: string | null;
  createdAt: string;
  actor: ReviewDecisionActor;
};

export type ReviewDecisionsResponse = {
  latest: ReviewDecision | null;
  history: ReviewDecision[];
};

export type CreateReviewDecisionInput = {
  mediaAssetId: string;
  status: ReviewDecisionStatus;
  note?: string;
};

export type CreateReviewDecisionResponse = {
  decision: ReviewDecision;
  noteRecommendation?: string;
};

export function getReviewDecisionStatusLabel(
  status: ReviewDecisionStatus | null | undefined,
): string {
  switch (status) {
    case "submitted_for_review":
      return "Submitted for Review";
    case "approved":
      return "Approved";
    case "revision_requested":
      return "Revision Requested";
    case "admin_override":
      return "Admin Override";
    default:
      return "Pending Review";
  }
}

export function formatReviewDecisionActor(actor: ReviewDecisionActor): string {
  const displayName = actor.displayName?.trim();
  if (displayName) return displayName;
  return actor.email;
}

export function formatReviewDecisionTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function fetchReviewDecisions(
  mediaAssetId: string,
): Promise<ReviewDecisionsResponse> {
  const query = new URLSearchParams({ mediaAssetId });
  const res = await fetch(`/api/agency/review-decisions?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to fetch review decisions";
    throw new Error(message);
  }

  return payload as ReviewDecisionsResponse;
}

export async function createReviewDecision(
  input: CreateReviewDecisionInput,
): Promise<CreateReviewDecisionResponse> {
  const res = await fetch("/api/agency/review-decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Failed to create review decision";
    throw new Error(message);
  }

  return payload as CreateReviewDecisionResponse;
}

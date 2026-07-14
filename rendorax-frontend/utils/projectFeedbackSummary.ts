import type { VideoCommentRow } from "@/utils/commentAuthor";

export type ProjectFeedbackCounts = {
  total: number;
  open: number;
  resolved: number;
};

export type ProjectFeedbackSummary = ProjectFeedbackCounts & {
  latest: VideoCommentRow[];
};

export type ProjectFeedbackSummaryMap = Record<string, ProjectFeedbackSummary>;

export function formatFeedbackTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function summarizeFeedbackRows(
  rows: VideoCommentRow[],
): ProjectFeedbackCounts {
  let open = 0;
  let resolved = 0;
  for (const row of rows) {
    if (row.is_resolved) resolved += 1;
    else open += 1;
  }
  return { total: rows.length, open, resolved };
}

/** Client-side helper when rows are already filtered by agency_project_id. */
export function buildProjectFeedbackSummary(
  rows: VideoCommentRow[],
  latestLimit = 3,
): ProjectFeedbackSummary {
  const sorted = [...rows].sort((a, b) => {
    const at = a.created_at ? Date.parse(a.created_at) : 0;
    const bt = b.created_at ? Date.parse(b.created_at) : 0;
    return bt - at;
  });
  return {
    ...summarizeFeedbackRows(rows),
    latest: sorted.slice(0, latestLimit),
  };
}

export async function fetchProjectFeedbackSummaries(
  projectIds: string[],
): Promise<ProjectFeedbackSummaryMap> {
  const ids = projectIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return {};

  const query = new URLSearchParams({ projectIds: ids.join(",") });
  const res = await fetch(`/api/agency/video-comments/summary?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.error === "string"
        ? err.error
        : "Failed to load feedback summary",
    );
  }

  const payload = (await res.json()) as {
    projects?: ProjectFeedbackSummaryMap;
  };
  return payload.projects ?? {};
}

export async function setCommentResolved(
  commentId: string,
  resolved: boolean,
): Promise<VideoCommentRow> {
  const res = await fetch(
    `/api/agency/video-comments/${encodeURIComponent(commentId)}/resolve`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.error === "string"
        ? err.error
        : "Failed to update resolve state",
    );
  }

  return (await res.json()) as VideoCommentRow;
}
